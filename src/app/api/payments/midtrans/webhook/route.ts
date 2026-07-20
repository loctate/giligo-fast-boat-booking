import {
  createHash,
  timingSafeEqual,
} from "node:crypto"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  getMidtransServerKey,
  midtransSnap,
} from "@/lib/midtrans-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type WebhookPayload =
  Record<string, unknown> & {
    order_id?: unknown
    status_code?: unknown
    gross_amount?: unknown
    signature_key?: unknown
    transaction_status?: unknown
  }

type BookingRow =
  Record<string, unknown> & {
    $id?: string
  }

type PaymentUpdate = {
  bookingStatus: string
  paymentStatus: string
  midtransOrderId: string
  midtransTransactionId?: string
  midtransTransactionStatus?: string
  midtransPaymentType?: string
  midtransFraudStatus?: string
}

type SeatAction =
  | "none"
  | "confirm"
  | "release"

type JourneyLabel =
  | "outbound"
  | "return"

type InventoryAdjustment = {
  journey: JourneyLabel
  inventoryId: string
  inventoryCode: string
  action: Exclude<
    SeatAction,
    "none"
  >
  bookedSeats: number
  heldSeats: number
  availableSeats: number
  salesStatus: string
}

class WebhookError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "WebhookError"
    this.status = status
  }
}

const REFUND_STATUSES =
  new Set([
    "refund",
    "partial_refund",
    "chargeback",
    "partial_chargeback",
  ])

const FINAL_LOCAL_PAYMENT_STATUSES =
  new Set([
    "paid",
    "refunded",
  ])

const TERMINAL_RELEASE_STATUSES =
  new Set([
    "deny",
    "cancel",
    "expire",
    "failure",
  ])


function noStoreJson(
  body: unknown,
  status = 200
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  })
}

function cleanText(
  value: unknown
): string {
  return String(value ?? "").trim()
}

function normalizeStatus(
  value: unknown
): string {
  return cleanText(value).toLowerCase()
}

function parseGrossAmount(
  value: unknown
): number | null {
  const text = cleanText(value)

  if (
    !/^\d+(?:\.\d{1,2})?$/.test(
      text
    )
  ) {
    return null
  }

  const amount = Number(text)

  return Number.isSafeInteger(amount)
    ? amount
    : null
}

function toStoredInteger(
  value: unknown
): number | null {
  const amount = Number(value)

  return Number.isSafeInteger(amount)
    ? amount
    : null
}

function getErrorCode(
  error: unknown
): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = Number(
      (
        error as {
          code?: unknown
        }
      ).code
    )

    return Number.isFinite(code)
      ? code
      : null
  }

  return null
}

async function rollbackTransaction(
  transactionId: string
) {
  try {
    await tablesDB.updateTransaction({
      transactionId,
      rollback: true,
    })
  } catch (rollbackError) {
    console.error(
      "Midtrans webhook transaction rollback error:",
      rollbackError
    )
  }
}

async function getTransactionRow(
  tableId: string,
  rowId: string,
  transactionId: string,
  notFoundMessage: string
): Promise<BookingRow> {
  try {
    const row =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId,
        rowId,
        transactionId,
      })

    return row as BookingRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      throw new WebhookError(
        404,
        notFoundMessage
      )
    }

    throw error
  }
}

function determineSeatAction({
  booking,
  update,
  transactionStatus,
}: {
  booking: BookingRow
  update: PaymentUpdate
  transactionStatus: string
}): SeatAction {
  const currentBookingStatus =
    normalizeStatus(
      booking.bookingStatus
    ) || "pending"

  const currentPaymentStatus =
    normalizeStatus(
      booking.paymentStatus
    ) || "pending"

  /*
   * Pada flow baru, Pending/Pending
   * berarti kursi booking masih Held.
   */
  const bookingStillHoldsSeats =
    currentBookingStatus ===
      "pending" &&
    currentPaymentStatus ===
      "pending"

  if (!bookingStillHoldsSeats) {
    return "none"
  }

  const nextBookingStatus =
    normalizeStatus(
      update.bookingStatus
    )

  const nextPaymentStatus =
    normalizeStatus(
      update.paymentStatus
    )

  if (
    nextBookingStatus ===
      "confirmed" &&
    nextPaymentStatus ===
      "paid"
  ) {
    return "confirm"
  }

  if (
    TERMINAL_RELEASE_STATUSES.has(
      transactionStatus
    )
  ) {
    return "release"
  }

  return "none"
}

async function adjustHeldInventory({
  inventoryId,
  passengerCount,
  transactionId,
  journey,
  action,
}: {
  inventoryId: string
  passengerCount: number
  transactionId: string
  journey: JourneyLabel
  action: Exclude<
    SeatAction,
    "none"
  >
}): Promise<InventoryAdjustment> {
  const inventory =
    await getTransactionRow(
      appwriteConfig
        .tripInventoryTableId,

      inventoryId,
      transactionId,

      `The ${journey} trip inventory linked to this booking could not be found.`
    )

  const seatCapacity =
    toStoredInteger(
      inventory.seatCapacity
    )

  const bookedSeats =
    toStoredInteger(
      inventory.bookedSeats
    )

  const heldSeats =
    toStoredInteger(
      inventory.heldSeats
    )

  if (
    seatCapacity === null ||
    bookedSeats === null ||
    heldSeats === null ||
    seatCapacity < 0 ||
    bookedSeats < 0 ||
    heldSeats < 0
  ) {
    throw new WebhookError(
      409,
      `The ${journey} trip inventory has invalid seat data.`
    )
  }

  if (heldSeats < passengerCount) {
    throw new WebhookError(
      409,
      `The held-seat count for the ${journey} trip is lower than this booking passenger count.`
    )
  }

  try {
    await tablesDB.decrementRowColumn({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      rowId:
        inventoryId,

      column:
        "heldSeats",

      value:
        passengerCount,

      min: 0,
      transactionId,
    })
  } catch (error) {
    console.error(
      `${journey} held-seat decrement error:`,
      error
    )

    throw new WebhookError(
      409,
      `The ${journey} held seats changed while the payment notification was being processed.`
    )
  }

  const nextHeldSeats =
    heldSeats - passengerCount

  let nextBookedSeats =
    bookedSeats

  if (action === "confirm") {
    try {
      await tablesDB.incrementRowColumn({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        rowId:
          inventoryId,

        column:
          "bookedSeats",

        value:
          passengerCount,

        max:
          seatCapacity -
          nextHeldSeats,

        transactionId,
      })
    } catch (error) {
      console.error(
        `${journey} booked-seat increment error:`,
        error
      )

      throw new WebhookError(
        409,
        `The ${journey} booked seats changed while the payment notification was being processed.`
      )
    }

    nextBookedSeats +=
      passengerCount
  }

  const availableSeats =
    seatCapacity -
    nextBookedSeats -
    nextHeldSeats

  if (availableSeats < 0) {
    throw new WebhookError(
      409,
      `The ${journey} inventory would exceed its seat capacity.`
    )
  }

  const currentSalesStatus =
    cleanText(
      inventory.salesStatus
    ).toUpperCase()

  let nextSalesStatus =
    currentSalesStatus

  if (
    availableSeats <= 0 &&
    currentSalesStatus === "OPEN"
  ) {
    await tablesDB.updateRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      rowId:
        inventoryId,

      data: {
        salesStatus:
          "SOLD_OUT",
      },

      transactionId,
    })

    nextSalesStatus =
      "SOLD_OUT"
  } else if (
    action === "release" &&
    availableSeats > 0 &&
    currentSalesStatus ===
      "SOLD_OUT"
  ) {
    await tablesDB.updateRow({
      databaseId:
        appwriteConfig.databaseId,

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
    journey,
    inventoryId,

    inventoryCode:
      cleanText(
        inventory.inventoryCode
      ),

    action,
    bookedSeats:
      nextBookedSeats,

    heldSeats:
      nextHeldSeats,

    availableSeats,

    salesStatus:
      nextSalesStatus,
  }
}

function createSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string
): string {
  return createHash("sha512")
    .update(
      orderId +
        statusCode +
        grossAmount +
        getMidtransServerKey(),
      "utf8"
    )
    .digest("hex")
}

function signaturesMatch(
  providedSignature: string,
  expectedSignature: string
): boolean {
  if (
    !/^[a-fA-F0-9]{128}$/.test(
      providedSignature
    ) ||
    !/^[a-fA-F0-9]{128}$/.test(
      expectedSignature
    )
  ) {
    return false
  }

  const providedBuffer =
    Buffer.from(
      providedSignature.toLowerCase(),
      "hex"
    )

  const expectedBuffer =
    Buffer.from(
      expectedSignature.toLowerCase(),
      "hex"
    )

  return timingSafeEqual(
    providedBuffer,
    expectedBuffer
  )
}

function verifySignature({
  orderId,
  statusCode,
  grossAmount,
  signature,
}: {
  orderId: string
  statusCode: string
  grossAmount: string
  signature: string
}): boolean {
  const expected =
    createSignature(
      orderId,
      statusCode,
      grossAmount
    )

  return signaturesMatch(
    signature,
    expected
  )
}

function extractBookingRowId(
  orderId: string
): string {
  const match =
    /^NGB-([A-Za-z0-9._~-]{1,36})-([A-Fa-f0-9]{8})$/.exec(
      orderId
    )

  if (!match) {
    throw new WebhookError(
      400,
      "The Midtrans order ID format is invalid."
    )
  }

  return match[1]
}

function createPaymentUpdate({
  booking,
  orderId,
  transactionStatus,
  statusCode,
  fraudStatus,
  transactionId,
  paymentType,
}: {
  booking: BookingRow
  orderId: string
  transactionStatus: string
  statusCode: string
  fraudStatus: string
  transactionId: string
  paymentType: string
}): PaymentUpdate {
  const currentBookingStatus =
    cleanText(
      booking.bookingStatus
    ) || "Pending"

  const currentPaymentStatus =
    cleanText(
      booking.paymentStatus
    ) || "Pending"

  const normalizedBookingStatus =
    currentBookingStatus
      .toLowerCase()

  const normalizedPaymentStatus =
    currentPaymentStatus
      .toLowerCase()

  const fraudIsAccepted =
    !fraudStatus ||
    fraudStatus === "accept"

  const paymentSucceeded =
    statusCode === "200" &&
    (
      transactionStatus ===
        "capture" ||
      transactionStatus ===
        "settlement"
    ) &&
    fraudIsAccepted

  const paymentWasRefunded =
    REFUND_STATUSES.has(
      transactionStatus
    )

  let nextBookingStatus =
    currentBookingStatus

  let nextPaymentStatus =
    currentPaymentStatus

  if (paymentSucceeded) {
    nextPaymentStatus =
      "Paid"

    /*
     * Booking yang telah dibatalkan atau
     * selesai tidak diubah otomatis.
     * Kondisi tersebut perlu review admin.
     */
    if (
      normalizedBookingStatus !==
        "cancelled" &&
      normalizedBookingStatus !==
        "completed"
    ) {
      nextBookingStatus =
        "Confirmed"
    }
  } else if (
    TERMINAL_RELEASE_STATUSES.has(
      transactionStatus
    )
  ) {
    /*
     * Status gagal terminal hanya
     * membatalkan booking yang masih
     * berada pada lifecycle Held.
     */
    if (
      normalizedBookingStatus ===
        "pending" &&
      normalizedPaymentStatus ===
        "pending"
    ) {
      nextBookingStatus =
        "Cancelled"
    }

    if (
      !FINAL_LOCAL_PAYMENT_STATUSES.has(
        normalizedPaymentStatus
      )
    ) {
      nextPaymentStatus =
        "Pending"
    }
  } else if (paymentWasRefunded) {
    nextPaymentStatus =
      "Refunded"
  } else if (
    !FINAL_LOCAL_PAYMENT_STATUSES.has(
      normalizedPaymentStatus
    )
  ) {
    /*
     * Pending, authorize, atau fraud
     * challenge tetap belum dibayar.
     */
    nextPaymentStatus =
      "Pending"
  }

  const update: PaymentUpdate = {
    bookingStatus:
      nextBookingStatus,

    paymentStatus:
      nextPaymentStatus,

    midtransOrderId:
      orderId,
  }

  if (transactionId) {
    update.midtransTransactionId =
      transactionId.slice(0, 64)
  }

  if (transactionStatus) {
    update.midtransTransactionStatus =
      transactionStatus.slice(0, 32)
  }

  if (paymentType) {
    update.midtransPaymentType =
      paymentType.slice(0, 32)
  }

  if (fraudStatus) {
    update.midtransFraudStatus =
      fraudStatus.slice(0, 16)
  }

  return update
}

function updateContainsChanges(
  booking: BookingRow,
  update: PaymentUpdate
): boolean {
  return Object.entries(update).some(
    ([key, value]) =>
      cleanText(
        booking[key]
      ) !== cleanText(value)
  )
}

export async function POST(
  request: Request
) {
  let appwriteTransactionId:
    | string
    | null = null

  try {
    let notification:
      WebhookPayload

    try {
      notification =
        (await request.json()) as
          WebhookPayload
    } catch {
      throw new WebhookError(
        400,
        "The webhook body must contain valid JSON."
      )
    }

    const orderId =
      cleanText(
        notification.order_id
      )

    const statusCode =
      cleanText(
        notification.status_code
      )

    const grossAmount =
      cleanText(
        notification.gross_amount
      )

    const signature =
      cleanText(
        notification.signature_key
      )

    if (
      !orderId ||
      !statusCode ||
      !grossAmount ||
      !signature
    ) {
      throw new WebhookError(
        400,
        "Required Midtrans webhook fields are missing."
      )
    }

    if (
      !verifySignature({
        orderId,
        statusCode,
        grossAmount,
        signature,
      })
    ) {
      throw new WebhookError(
        401,
        "The Midtrans webhook signature is invalid."
      )
    }

    const bookingRowId =
      extractBookingRowId(
        orderId
      )

    let booking: BookingRow

    try {
      booking =
        await tablesDB.getRow({
          databaseId:
            appwriteConfig.databaseId,

          tableId:
            appwriteConfig
              .bookingsTableId,

          rowId:
            bookingRowId,
        }) as BookingRow
    } catch (error) {
      console.error(
        "Midtrans webhook booking lookup failed:",
        {
          bookingRowId,
          orderId,
          error,
        }
      )

      throw new WebhookError(
        404,
        "The linked booking could not be found."
      )
    }

    const activeOrderId =
      cleanText(
        booking.midtransOrderId
      )

    /*
     * Booking tanpa active order ID tidak
     * menerima perubahan dari Midtrans.
     */
    if (!activeOrderId) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The booking has no active Midtrans order.",
      })
    }

    const orderIsActive =
      activeOrderId === orderId

    const notificationTransactionStatus =
      normalizeStatus(
        notification
          .transaction_status
      )

    const notificationMayRepresentMoneyMovement =
      notificationTransactionStatus ===
        "capture" ||
      notificationTransactionStatus ===
        "settlement" ||
      REFUND_STATUSES.has(
        notificationTransactionStatus
      )

    /*
     * Order lama yang belum berhasil,
     * ditolak, dibatalkan, atau expired
     * dapat langsung diabaikan.
     *
     * Order lama yang mengaku sukses atau
     * refund tetap diverifikasi melalui
     * Get Status agar pembayaran valid
     * tidak hilang dari pencatatan.
     */
    if (
      !orderIsActive &&
      !notificationMayRepresentMoneyMovement
    ) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The inactive Midtrans order has no final money movement.",
      })
    }

    let authoritativeStatus:
      Record<string, unknown>

    try {
      authoritativeStatus =
        await midtransSnap
          .transaction
          .status(orderId)
    } catch (error) {
      console.error(
        "Midtrans Get Status failed:",
        {
          orderId,
          error,
        }
      )

      throw new WebhookError(
        503,
        "Midtrans transaction status is temporarily unavailable."
      )
    }

    const verifiedOrderId =
      cleanText(
        authoritativeStatus.order_id
      )

    const verifiedStatusCode =
      cleanText(
        authoritativeStatus.status_code
      )

    const verifiedGrossAmount =
      cleanText(
        authoritativeStatus.gross_amount
      )

    const verifiedSignature =
      cleanText(
        authoritativeStatus.signature_key
      )

    if (
      verifiedOrderId !==
      orderId
    ) {
      throw new WebhookError(
        502,
        "Midtrans returned a mismatched order ID."
      )
    }

    /*
     * Get Status merupakan komunikasi
     * backend-to-backend. Bila signature
     * tersedia, lakukan validasi tambahan.
     */
    if (
      verifiedSignature &&
      !verifySignature({
        orderId:
          verifiedOrderId,

        statusCode:
          verifiedStatusCode,

        grossAmount:
          verifiedGrossAmount,

        signature:
          verifiedSignature,
      })
    ) {
      throw new WebhookError(
        502,
        "Midtrans returned an invalid status signature."
      )
    }

    const storedTotal =
      toStoredInteger(
        booking.totalPrice
      )

    const verifiedTotal =
      parseGrossAmount(
        verifiedGrossAmount
      )

    if (
      storedTotal === null ||
      storedTotal <= 0 ||
      verifiedTotal === null ||
      verifiedTotal !==
        storedTotal
    ) {
      throw new WebhookError(
        409,
        "The Midtrans transaction amount does not match the booking."
      )
    }

    const currency =
      cleanText(
        authoritativeStatus.currency
      ).toUpperCase() || "IDR"

    if (currency !== "IDR") {
      throw new WebhookError(
        409,
        "The Midtrans transaction currency is invalid."
      )
    }

    const transactionStatus =
      normalizeStatus(
        authoritativeStatus
          .transaction_status
      )

    if (!transactionStatus) {
      throw new WebhookError(
        502,
        "Midtrans returned no transaction status."
      )
    }

    const authoritativeHasMoneyMovement =
      transactionStatus ===
        "capture" ||
      transactionStatus ===
        "settlement" ||
      REFUND_STATUSES.has(
        transactionStatus
      )

    /*
     * Payload awal hanya digunakan untuk
     * menentukan apakah order lama perlu
     * diperiksa. Keputusan akhir tetap
     * berasal dari Get Status Midtrans.
     */
    if (
      !orderIsActive &&
      !authoritativeHasMoneyMovement
    ) {
      return noStoreJson({
        success: true,
        ignored: true,
        reason:
          "The inactive Midtrans order is not successful or refunded.",
        orderId,
        transactionStatus,
      })
    }

    const fraudStatus =
      normalizeStatus(
        authoritativeStatus
          .fraud_status
      )

    const midtransTransactionId =
      cleanText(
        authoritativeStatus
          .transaction_id
      )

    const paymentType =
      normalizeStatus(
        authoritativeStatus
          .payment_type
      )

    const appwriteTransaction =
      await tablesDB.createTransaction({
        ttl: 60,
      })

    appwriteTransactionId =
      cleanText(
        appwriteTransaction.$id
      )

    if (!appwriteTransactionId) {
      throw new WebhookError(
        500,
        "The webhook transaction could not be created."
      )
    }

    /*
     * Booking dibaca ulang di dalam
     * transaction agar dua webhook
     * bersamaan tidak memindahkan
     * kursi dua kali.
     */
    const transactionalBooking =
      await getTransactionRow(
        appwriteConfig
          .bookingsTableId,

        bookingRowId,
        appwriteTransactionId,

        "The linked booking could not be found."
      )

    const transactionalActiveOrderId =
      cleanText(
        transactionalBooking
          .midtransOrderId
      )

    if (!transactionalActiveOrderId) {
      await rollbackTransaction(
        appwriteTransactionId
      )

      appwriteTransactionId =
        null

      return noStoreJson({
        success: true,
        ignored: true,

        reason:
          "The booking has no active Midtrans order.",
      })
    }

    const transactionalOrderIsActive =
      transactionalActiveOrderId ===
      orderId

    if (
      !transactionalOrderIsActive &&
      !authoritativeHasMoneyMovement
    ) {
      await rollbackTransaction(
        appwriteTransactionId
      )

      appwriteTransactionId =
        null

      return noStoreJson({
        success: true,
        ignored: true,

        reason:
          "The inactive Midtrans order is not successful or refunded.",

        orderId,
        transactionStatus,
      })
    }

    const transactionalStoredTotal =
      toStoredInteger(
        transactionalBooking
          .totalPrice
      )

    if (
      transactionalStoredTotal ===
        null ||
      transactionalStoredTotal <= 0 ||
      transactionalStoredTotal !==
        verifiedTotal
    ) {
      throw new WebhookError(
        409,
        "The booking total changed while the payment notification was being processed."
      )
    }

    const update =
      createPaymentUpdate({
        booking:
          transactionalBooking,

        orderId,
        transactionStatus,

        statusCode:
          verifiedStatusCode,

        fraudStatus,

        transactionId:
          midtransTransactionId,

        paymentType,
      })

    const seatAction =
      determineSeatAction({
        booking:
          transactionalBooking,

        update,
        transactionStatus,
      })

    const inventoryAdjustments:
      InventoryAdjustment[] = []

    if (seatAction !== "none") {
      const passengerCount =
        toStoredInteger(
          transactionalBooking
            .passengerCount
        )

      if (
        passengerCount === null ||
        passengerCount < 1
      ) {
        throw new WebhookError(
          409,
          "The booking has an invalid passenger count."
        )
      }

      const outboundInventoryId =
        cleanText(
          transactionalBooking
            .tripInventoryId
        ) ||
        cleanText(
          transactionalBooking
            .tripId
        )

      const returnInventoryId =
        cleanText(
          transactionalBooking
            .returnTripInventoryId
        )

      const tripType =
        normalizeStatus(
          transactionalBooking
            .tripType
        )

      if (!outboundInventoryId) {
        throw new WebhookError(
          409,
          "The booking has no linked outbound inventory."
        )
      }

      if (
        tripType === "round-trip" &&
        !returnInventoryId
      ) {
        throw new WebhookError(
          409,
          "The round-trip booking has no linked return inventory."
        )
      }

      if (
        returnInventoryId &&
        returnInventoryId ===
          outboundInventoryId
      ) {
        throw new WebhookError(
          409,
          "Outbound and return inventory IDs cannot be identical."
        )
      }

      const outboundAdjustment =
        await adjustHeldInventory({
          inventoryId:
            outboundInventoryId,

          passengerCount,

          transactionId:
            appwriteTransactionId,

          journey:
            "outbound",

          action:
            seatAction,
        })

      inventoryAdjustments.push(
        outboundAdjustment
      )

      if (returnInventoryId) {
        const returnAdjustment =
          await adjustHeldInventory({
            inventoryId:
              returnInventoryId,

            passengerCount,

            transactionId:
              appwriteTransactionId,

            journey:
              "return",

            action:
              seatAction,
          })

        inventoryAdjustments.push(
          returnAdjustment
        )
      }
    }

    const bookingNeedsUpdate =
      updateContainsChanges(
        transactionalBooking,
        update
      )

    if (
      !bookingNeedsUpdate &&
      seatAction === "none"
    ) {
      await rollbackTransaction(
        appwriteTransactionId
      )

      appwriteTransactionId =
        null

      return noStoreJson({
        success: true,
        idempotent: true,

        orderId,
        transactionStatus,

        bookingStatus:
          update.bookingStatus,

        paymentStatus:
          update.paymentStatus,

        seatAction,
        inventoryAdjustments,
      })
    }

    await tablesDB.updateRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .bookingsTableId,

      rowId:
        bookingRowId,

      data:
        update,

      transactionId:
        appwriteTransactionId,
    })

    await tablesDB.updateTransaction({
      transactionId:
        appwriteTransactionId,

      commit: true,
    })

    appwriteTransactionId =
      null

    return noStoreJson({
      success: true,
      orderId,
      transactionStatus,

      bookingStatus:
        update.bookingStatus,

      paymentStatus:
        update.paymentStatus,

      seatAction,
      inventoryAdjustments,
    })

  } catch (error) {
    if (appwriteTransactionId) {
      await rollbackTransaction(
        appwriteTransactionId
      )

      appwriteTransactionId =
        null
    }

    if (
      error instanceof
      WebhookError
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            error.message,
        },
        error.status
      )
    }

    const errorCode =
      getErrorCode(error)

    if (errorCode === 409) {
      return noStoreJson(
        {
          success: false,

          error:
            "The booking or linked inventory changed while the payment notification was processed. Midtrans may retry this notification.",
        },

        503
      )
    }

    console.error(
      "Unexpected Midtrans webhook error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          "The Midtrans webhook could not be processed.",
      },
      500
    )
  }
}
