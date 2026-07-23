import {
  createHash,
  timingSafeEqual,
} from "node:crypto"

import {
  Query,
} from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  getSeatHoldExpiryTimestamp,
} from "@/lib/seat-hold"

export const runtime =
  "nodejs"

export const dynamic =
  "force-dynamic"

const MAX_PROCESS_PER_RUN =
  20

type AppwriteRow =
  Record<string, unknown> & {
    $id?: string
  }

type CandidateBooking = {
  id: string
  bookingCode: string
}

type CandidateScanResult = {
  candidates:
    CandidateBooking[]

  scannedRows:
    number

  scanLimitReached:
    boolean
}

type CleanupResult =
  | {
      state:
        "processed"

      bookingId:
        string

      bookingCode:
        string

      releasedSeats:
        number

      inventoryIds:
        string[]
    }
  | {
      state:
        "skipped"

      bookingId:
        string

      bookingCode:
        string

      reason:
        string
    }
  | {
      state:
        "failed"

      bookingId:
        string

      bookingCode:
        string

      reason:
        string
    }

class CleanupError
  extends Error {
  status:
    number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name =
      "CleanupError"

    this.status =
      status
  }
}

function noStoreJson(
  body: unknown,
  status = 200
) {
  return Response.json(
    body,
    {
      status,

      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  )
}

function cleanText(
  value: unknown
): string {
  return String(
    value ?? ""
  ).trim()
}

function toInteger(
  value: unknown
): number | null {
  const number =
    Number(value)

  return (
    Number.isInteger(number)
      ? number
      : null
  )
}

function getErrorCode(
  error: unknown
): number | null {
  if (
    error &&
    typeof error ===
      "object" &&
    "code" in error
  ) {
    const code =
      Number(
        error.code
      )

    return (
      Number.isFinite(code)
        ? code
        : null
    )
  }

  return null
}

function getCronSecret():
  string {
  const secret =
    process.env
      .CRON_SECRET
      ?.trim()

  if (!secret) {
    throw new CleanupError(
      503,
      "The cleanup endpoint is not configured."
    )
  }

  if (
    secret.length <
    32
  ) {
    throw new CleanupError(
      503,
      "The cleanup endpoint secret is invalid."
    )
  }

  return secret
}

function secureTextEquals(
  firstValue: string,
  secondValue: string
): boolean {
  const firstDigest =
    createHash("sha256")
      .update(firstValue)
      .digest()

  const secondDigest =
    createHash("sha256")
      .update(secondValue)
      .digest()

  return timingSafeEqual(
    firstDigest,
    secondDigest
  )
}

function verifyAuthorization(
  request: Request,
  cronSecret: string
) {
  const authorization =
    cleanText(
      request.headers.get(
        "authorization"
      )
    )

  const expected =
    `Bearer ${cronSecret}`

  if (
    !secureTextEquals(
      authorization,
      expected
    )
  ) {
    throw new CleanupError(
      401,
      "Unauthorized."
    )
  }
}

async function rollbackTransaction(
  transactionId: string
) {
  try {
    await tablesDB
      .updateTransaction({
        transactionId,
        rollback:
          true,
      })
  } catch (rollbackError) {
    console.error(
      "Expired booking cleanup rollback error:",
      rollbackError
    )
  }
}

async function getTransactionRow(
  tableId: string,
  rowId: string,
  transactionId: string
): Promise<AppwriteRow> {
  try {
    const row =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig
            .databaseId,

        tableId,
        rowId,
        transactionId,
      })

    return (
      row as unknown as
        AppwriteRow
    )
  } catch (error) {
    if (
      getErrorCode(error) ===
      404
    ) {
      throw new CleanupError(
        404,
        "The referenced row could not be found."
      )
    }

    throw error
  }
}

function isPendingBooking(
  booking: AppwriteRow
): boolean {
  return (
    cleanText(
      booking.bookingStatus
    ).toLowerCase() ===
      "pending" &&
    cleanText(
      booking.paymentStatus
    ).toLowerCase() ===
      "pending"
  )
}

function getExpiredTimestamp(
  booking: AppwriteRow
): number | null {
  try {
    return (
      getSeatHoldExpiryTimestamp(
        booking
          .seatHoldExpiresAt
      )
    )
  } catch {
    return null
  }
}

async function listExpiredCandidates(
  nowTimestamp: number
): Promise<CandidateScanResult> {
  const expiryCutoff =
    new Date(
      nowTimestamp
    ).toISOString()

  /*
   * Fetch one extra row so the
   * response can report whether
   * another cleanup batch remains.
   */
  const response =
    await tablesDB.listRows({
      databaseId:
        appwriteConfig
          .databaseId,

      tableId:
        appwriteConfig
          .bookingsTableId,

      queries: [
        Query.equal(
          "bookingStatus",
          ["Pending"]
        ),

        Query.equal(
          "paymentStatus",
          ["Pending"]
        ),

        Query.lessThanEqual(
          "seatHoldExpiresAt",
          expiryCutoff
        ),

        Query.orderAsc(
          "seatHoldExpiresAt"
        ),

        Query.limit(
          MAX_PROCESS_PER_RUN +
            1
        ),
      ],
    })

  const rows =
    response.rows as unknown as
      AppwriteRow[]

  const scanLimitReached =
    rows.length >
      MAX_PROCESS_PER_RUN

  const candidates =
    rows
      .slice(
        0,
        MAX_PROCESS_PER_RUN
      )
      .flatMap(
        (
          row
        ): CandidateBooking[] => {
          const bookingId =
            cleanText(
              row.$id
            )

          if (!bookingId) {
            return []
          }

          return [{
            id:
              bookingId,

            bookingCode:
              cleanText(
                row.bookingCode
              ),
          }]
        }
      )

  return {
    candidates,

    scannedRows:
      rows.length,

    scanLimitReached,
  }
}

async function releaseInventoryHeldSeats({
  inventoryId,
  passengerCount,
  transactionId,
  journey,
}: {
  inventoryId: string
  passengerCount: number
  transactionId: string
  journey:
    "outbound" | "return"
}) {
  const inventory =
    await getTransactionRow(
      appwriteConfig
        .tripInventoryTableId,

      inventoryId,
      transactionId
    )

  const seatCapacity =
    toInteger(
      inventory
        .seatCapacity
    )

  const bookedSeats =
    toInteger(
      inventory
        .bookedSeats
    )

  const heldSeats =
    toInteger(
      inventory
        .heldSeats
    )

  const salesStatus =
    cleanText(
      inventory
        .salesStatus
    ).toUpperCase()

  if (
    seatCapacity === null ||
    bookedSeats === null ||
    heldSeats === null ||
    seatCapacity < 0 ||
    bookedSeats < 0 ||
    heldSeats < 0 ||
    bookedSeats +
      heldSeats >
      seatCapacity
  ) {
    throw new CleanupError(
      409,
      `The ${journey} inventory has invalid seat data.`
    )
  }

  if (
    heldSeats <
    passengerCount
  ) {
    throw new CleanupError(
      409,
      `The ${journey} inventory held-seat count is lower than the booking passenger count.`
    )
  }

  try {
    await tablesDB
      .decrementRowColumn({
        databaseId:
          appwriteConfig
            .databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        rowId:
          inventoryId,

        column:
          "heldSeats",

        value:
          passengerCount,

        min:
          0,

        transactionId,
      })
  } catch (error) {
    console.error(
      `${journey} expired held-seat decrement error:`,
      error
    )

    throw new CleanupError(
      409,
      `The ${journey} inventory changed during cleanup.`
    )
  }

  const nextHeldSeats =
    heldSeats -
    passengerCount

  const availableSeats =
    seatCapacity -
    bookedSeats -
    nextHeldSeats

  let nextSalesStatus =
    salesStatus

  /*
   * Expired holds only reopen inventory
   * that was automatically marked SOLD_OUT.
   *
   * CLOSED and CANCELLED inventory remain
   * unchanged and must be reopened manually.
   */
  if (
    availableSeats > 0 &&
    salesStatus === "SOLD_OUT"
  ) {
    await tablesDB.updateRow({
      databaseId:
        appwriteConfig
          .databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      rowId:
        inventoryId,

      data: {
        salesStatus:
          "OPEN",
      },

      transactionId,
    })

    nextSalesStatus =
      "OPEN"
  }

  return {
    inventoryId,

    releasedSeats:
      passengerCount,

    heldSeats:
      nextHeldSeats,

    availableSeats,

    salesStatus:
      nextSalesStatus,
  }
}

async function processCandidate(
  candidate:
    CandidateBooking,
  nowTimestamp:
    number
): Promise<CleanupResult> {
  let transactionId:
    string | null = null

  try {
    const transaction =
      await tablesDB
        .createTransaction({
          ttl:
            60,
        })

    transactionId =
      cleanText(
        transaction.$id
      )

    if (!transactionId) {
      throw new CleanupError(
        500,
        "The cleanup transaction could not be created."
      )
    }

    const booking =
      await getTransactionRow(
        appwriteConfig
          .bookingsTableId,

        candidate.id,
        transactionId
      )

    const bookingCode =
      cleanText(
        booking.bookingCode
      ) ||
      candidate.bookingCode

    if (
      !isPendingBooking(
        booking
      )
    ) {
      await rollbackTransaction(
        transactionId
      )

      transactionId =
        null

      return {
        state:
          "skipped",

        bookingId:
          candidate.id,

        bookingCode,

        reason:
          "Booking is no longer Pending/Pending.",
      }
    }

    const expiryTimestamp =
      getExpiredTimestamp(
        booking
      )

    if (
      expiryTimestamp ===
      null
    ) {
      await rollbackTransaction(
        transactionId
      )

      transactionId =
        null

      return {
        state:
          "skipped",

        bookingId:
          candidate.id,

        bookingCode,

        reason:
          "Booking expiry is missing or invalid.",
      }
    }

    if (
      expiryTimestamp >
      nowTimestamp
    ) {
      await rollbackTransaction(
        transactionId
      )

      transactionId =
        null

      return {
        state:
          "skipped",

        bookingId:
          candidate.id,

        bookingCode,

        reason:
          "Booking is no longer expired.",
      }
    }

    const passengerCount =
      toInteger(
        booking
          .passengerCount
      )

    if (
      passengerCount ===
        null ||
      passengerCount <
        1
    ) {
      throw new CleanupError(
        409,
        "The booking passenger count is invalid."
      )
    }

    const outboundInventoryId =
      cleanText(
        booking
          .tripInventoryId
      )

    const returnInventoryId =
      cleanText(
        booking
          .returnTripInventoryId
      )

    if (
      !outboundInventoryId
    ) {
      throw new CleanupError(
        409,
        "The booking outbound inventory ID is missing."
      )
    }

    if (
      returnInventoryId &&
      returnInventoryId ===
        outboundInventoryId
    ) {
      throw new CleanupError(
        409,
        "Outbound and return inventory IDs cannot be identical."
      )
    }

    const adjustments = []

    const outboundAdjustment =
      await releaseInventoryHeldSeats({
        inventoryId:
          outboundInventoryId,

        passengerCount,
        transactionId,

        journey:
          "outbound",
      })

    adjustments.push(
      outboundAdjustment
    )

    if (returnInventoryId) {
      const returnAdjustment =
        await releaseInventoryHeldSeats({
          inventoryId:
            returnInventoryId,

          passengerCount,
          transactionId,

          journey:
            "return",
        })

      adjustments.push(
        returnAdjustment
      )
    }

    await tablesDB.updateRow({
      databaseId:
        appwriteConfig
          .databaseId,

      tableId:
        appwriteConfig
          .bookingsTableId,

      rowId:
        candidate.id,

      data: {
        bookingStatus:
          "Cancelled",

        paymentStatus:
          "Pending",

        seatHoldExpiresAt:
          null,
      },

      transactionId,
    })

    await tablesDB
      .updateTransaction({
        transactionId,
        commit:
          true,
      })

    transactionId =
      null

    return {
      state:
        "processed",

      bookingId:
        candidate.id,

      bookingCode,

      releasedSeats:
        adjustments.reduce(
          (
            total,
            adjustment
          ) =>
            total +
            adjustment
              .releasedSeats,
          0
        ),

      inventoryIds:
        adjustments.map(
          (adjustment) =>
            adjustment
              .inventoryId
        ),
    }
  } catch (error) {
    if (transactionId) {
      await rollbackTransaction(
        transactionId
      )

      transactionId =
        null
    }

    console.error(
      "Expired held booking cleanup candidate error:",
      {
        bookingId:
          candidate.id,

        bookingCode:
          candidate.bookingCode,

        error,
      }
    )

    return {
      state:
        "failed",

      bookingId:
        candidate.id,

      bookingCode:
        candidate.bookingCode,

      reason:
        error instanceof Error
          ? error.message
          : "Unknown cleanup error.",
    }
  }
}

export async function POST(
  request: Request
) {
  try {
    const cronSecret =
      getCronSecret()

    verifyAuthorization(
      request,
      cronSecret
    )

    const startedAt =
      new Date()

    const nowTimestamp =
      startedAt.getTime()

    const scanResult =
      await listExpiredCandidates(
        nowTimestamp
      )

    const results:
      CleanupResult[] = []

    for (
      const candidate
      of scanResult.candidates
    ) {
      results.push(
        await processCandidate(
          candidate,
          nowTimestamp
        )
      )
    }

    const processed =
      results.filter(
        (result) =>
          result.state ===
          "processed"
      )

    const skipped =
      results.filter(
        (result) =>
          result.state ===
          "skipped"
      )

    const failed =
      results.filter(
        (result) =>
          result.state ===
          "failed"
      )

    return noStoreJson({
      success:
        failed.length === 0,

      startedAt:
        startedAt
          .toISOString(),

      finishedAt:
        new Date()
          .toISOString(),

      scannedRows:
        scanResult
          .scannedRows,

      candidateCount:
        scanResult
          .candidates
          .length,

      processedCount:
        processed.length,

      skippedCount:
        skipped.length,

      failedCount:
        failed.length,

      scanLimitReached:
        scanResult
          .scanLimitReached,

      processLimit:
        MAX_PROCESS_PER_RUN,

      results,
    })
  } catch (error) {
    console.error(
      "Expired held booking cleanup endpoint error:",
      error
    )

    const status =
      error instanceof
        CleanupError
        ? error.status
        : 500

    const message =
      error instanceof
        CleanupError
        ? error.message
        : "The expired booking cleanup could not be completed."

    return noStoreJson(
      {
        success:
          false,

        error:
          message,
      },
      status
    )
  }
}
