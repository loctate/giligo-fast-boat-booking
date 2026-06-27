import { getCurrentAdmin } from "@/lib/admin-auth"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const allowedBookingStatuses = [
  "Pending",
  "Confirmed",
  "Completed",
  "Cancelled",
] as const

const allowedPaymentStatuses = [
  "Demo",
  "Pending",
  "Paid",
  "Refunded",
] as const

type BookingStatus =
  (typeof allowedBookingStatuses)[number]

type PaymentStatus =
  (typeof allowedPaymentStatuses)[number]

type JourneyLabel =
  | "outbound"
  | "return"

type UpdateBookingRequest = {
  bookingStatus?: unknown
  paymentStatus?: unknown
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type AppwriteRow = Record<
  string,
  unknown
> & {
  $id?: string
}

type InventoryAdjustment = {
  journey: JourneyLabel
  inventoryId: string
  adjusted: boolean
  availableSeats: number | null
  salesStatus: string | null
}

class StatusUpdateError extends Error {
  status: number

  constructor(
    status: number,
    message: string
  ) {
    super(message)

    this.name = "StatusUpdateError"
    this.status = status
  }
}

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

function toInteger(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue)
    ? parsedValue
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

function isBookingStatus(
  value: string
): value is BookingStatus {
  return allowedBookingStatuses.includes(
    value as BookingStatus
  )
}

function isPaymentStatus(
  value: string
): value is PaymentStatus {
  return allowedPaymentStatuses.includes(
    value as PaymentStatus
  )
}

function isAllowedTransition(
  currentStatus: BookingStatus,
  nextStatus: BookingStatus
): boolean {
  const transitions: Record<
    BookingStatus,
    BookingStatus[]
  > = {
    Pending: [
      "Pending",
      "Confirmed",
      "Cancelled",
    ],

    Confirmed: [
      "Pending",
      "Confirmed",
      "Completed",
      "Cancelled",
    ],

    Completed: [
      "Completed",
    ],

    Cancelled: [
      "Cancelled",
      "Pending",
      "Confirmed",
    ],
  }

  return transitions[
    currentStatus
  ].includes(nextStatus)
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
      "Booking status rollback error:",
      rollbackError
    )
  }
}

async function getTransactionRow(
  tableId: string,
  rowId: string,
  transactionId: string,
  notFoundMessage: string
): Promise<AppwriteRow> {
  try {
    const row =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId,
        rowId,
        transactionId,
      })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      throw new StatusUpdateError(
        404,
        notFoundMessage
      )
    }

    throw error
  }
}

async function adjustInventorySeats({
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
  action:
    | "cancel"
    | "reactivate"
}): Promise<InventoryAdjustment> {
  const inventory =
    await getTransactionRow(
      appwriteConfig
        .tripInventoryTableId,

      inventoryId,
      transactionId,

      `The ${journey} trip inventory could not be found.`
    )

  const seatCapacity =
    toInteger(
      inventory.seatCapacity
    )

  const bookedSeats =
    toInteger(
      inventory.bookedSeats
    )

  const heldSeats =
    toInteger(
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
    throw new StatusUpdateError(
      409,
      `The ${journey} inventory has invalid seat data.`
    )
  }

  const salesStatus =
    cleanText(
      inventory.salesStatus
    ).toUpperCase()

  if (action === "cancel") {
    if (
      bookedSeats <
      passengerCount
    ) {
      throw new StatusUpdateError(
        409,
        `The booked-seat count for the ${journey} inventory is lower than this booking passenger count.`
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
          "bookedSeats",

        value:
          passengerCount,

        min: 0,
        transactionId,
      })
    } catch (error) {
      console.error(
        `${journey} cancellation seat adjustment error:`,
        error
      )

      throw new StatusUpdateError(
        409,
        `The ${journey} trip inventory changed while the cancellation was being processed.`
      )
    }

    const nextBookedSeats =
      bookedSeats -
      passengerCount

    const availableSeats =
      seatCapacity -
      nextBookedSeats -
      heldSeats

    let nextSalesStatus =
      salesStatus

    /*
     * Pembatalan membuka kembali inventory
     * yang sebelumnya SOLD_OUT apabila
     * kursi sudah tersedia.
     *
     * Inventory CLOSED atau CANCELLED
     * tidak dibuka secara otomatis.
     */
    if (
      salesStatus === "SOLD_OUT" &&
      availableSeats > 0
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

      nextSalesStatus = "OPEN"
    }

    return {
      journey,
      inventoryId,
      adjusted: true,
      availableSeats,
      salesStatus:
        nextSalesStatus,
    }
  }

  /*
   * Reactivation
   */
  if (
    inventory.isActive !== true
  ) {
    throw new StatusUpdateError(
      409,
      `The ${journey} inventory is inactive and cannot accept this booking.`
    )
  }

  if (
    salesStatus === "CLOSED" ||
    salesStatus === "CANCELLED"
  ) {
    throw new StatusUpdateError(
      409,
      `The ${journey} inventory is not open for booking reactivation.`
    )
  }

  const currentAvailableSeats =
    seatCapacity -
    bookedSeats -
    heldSeats

  if (
    currentAvailableSeats <
    passengerCount
  ) {
    throw new StatusUpdateError(
      409,

      currentAvailableSeats <= 0
        ? `The ${journey} trip is sold out.`
        : `Only ${currentAvailableSeats} seats remain in the ${journey} inventory.`
    )
  }

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
        heldSeats,

      transactionId,
    })
  } catch (error) {
    console.error(
      `${journey} reactivation seat adjustment error:`,
      error
    )

    throw new StatusUpdateError(
      409,
      `The ${journey} trip inventory changed while the booking was being reactivated.`
    )
  }

  const nextBookedSeats =
    bookedSeats +
    passengerCount

  const availableSeats =
    seatCapacity -
    nextBookedSeats -
    heldSeats

  let nextSalesStatus =
    salesStatus

  if (
    availableSeats <= 0 &&
    salesStatus !== "SOLD_OUT"
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
    availableSeats > 0 &&
    salesStatus === "SOLD_OUT"
  ) {
    /*
     * Penanganan defensif apabila status
     * SOLD_OUT tidak sesuai dengan jumlah
     * kursi aktual.
     */
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

    nextSalesStatus = "OPEN"
  }

  return {
    journey,
    inventoryId,
    adjusted: true,
    availableSeats,
    salesStatus:
      nextSalesStatus,
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  let transactionId:
    | string
    | null = null

  try {
    const admin =
      await getCurrentAdmin()

    if (!admin) {
      throw new StatusUpdateError(
        401,
        "Unauthorized. Please sign in as admin."
      )
    }

    const { id } =
      await context.params

    const bookingId =
      cleanText(id)

    if (!bookingId) {
      throw new StatusUpdateError(
        400,
        "Booking ID is required."
      )
    }

    let body:
      UpdateBookingRequest

    try {
      body =
        (await request.json()) as UpdateBookingRequest
    } catch {
      throw new StatusUpdateError(
        400,
        "The request body is not valid JSON."
      )
    }

    const nextBookingStatus =
      cleanText(
        body.bookingStatus
      )

    const nextPaymentStatus =
      cleanText(
        body.paymentStatus
      )

    if (
      !isBookingStatus(
        nextBookingStatus
      )
    ) {
      throw new StatusUpdateError(
        400,
        "Invalid booking status."
      )
    }

    if (
      !isPaymentStatus(
        nextPaymentStatus
      )
    ) {
      throw new StatusUpdateError(
        400,
        "Invalid payment status."
      )
    }

    const transaction =
      await tablesDB.createTransaction({
        ttl: 60,
      })

    transactionId =
      cleanText(
        transaction.$id
      )

    if (!transactionId) {
      throw new StatusUpdateError(
        500,
        "The status update transaction could not be created."
      )
    }

    const booking =
      await getTransactionRow(
        appwriteConfig
          .bookingsTableId,

        bookingId,
        transactionId,

        "Booking could not be found."
      )

    const currentBookingStatus =
      cleanText(
        booking.bookingStatus
      )

    if (
      !isBookingStatus(
        currentBookingStatus
      )
    ) {
      throw new StatusUpdateError(
        409,
        "The booking has an unsupported current status."
      )
    }

    if (
      !isAllowedTransition(
        currentBookingStatus,
        nextBookingStatus
      )
    ) {
      throw new StatusUpdateError(
        409,

        `Booking status cannot be changed from ${currentBookingStatus} to ${nextBookingStatus}.`
      )
    }

    const isCancelling =
      currentBookingStatus !==
        "Cancelled" &&
      nextBookingStatus ===
        "Cancelled"

    const isReactivating =
      currentBookingStatus ===
        "Cancelled" &&
      nextBookingStatus !==
        "Cancelled"

    const needsSeatAdjustment =
      isCancelling ||
      isReactivating

    const passengerCount =
      toInteger(
        booking.passengerCount
      )

    if (
      needsSeatAdjustment &&
      (
        passengerCount === null ||
        passengerCount < 1
      )
    ) {
      throw new StatusUpdateError(
        409,
        "The booking has an invalid passenger count."
      )
    }

    /*
     * Field lama tripInventoryId tetap
     * menjadi outbound inventory.
     * tripId dipakai sebagai fallback
     * untuk booking lama.
     */
    const outboundInventoryId =
      cleanText(
        booking.tripInventoryId
      ) ||
      cleanText(
        booking.tripId
      )

    const returnInventoryId =
      cleanText(
        booking.returnTripInventoryId
      )

    const bookingTripType =
      cleanText(
        booking.tripType
      ).toLowerCase()

    if (
      needsSeatAdjustment &&
      bookingTripType ===
        "round-trip" &&
      !returnInventoryId
    ) {
      throw new StatusUpdateError(
        409,
        "This round-trip booking does not contain a linked return inventory. Its status cannot be changed safely."
      )
    }

    const inventoryAdjustments:
      InventoryAdjustment[] = []

    if (
      needsSeatAdjustment &&
      passengerCount !== null
    ) {
      const action =
        isCancelling
          ? "cancel"
          : "reactivate"

      /*
       * Booking lama yang tidak memiliki
       * inventory ID masih boleh diperbarui
       * statusnya tanpa perubahan kursi.
       *
       * Booking round-trip baru wajib
       * memiliki kedua inventory.
       */
      if (outboundInventoryId) {
        const outboundAdjustment =
          await adjustInventorySeats({
            inventoryId:
              outboundInventoryId,

            passengerCount,
            transactionId,

            journey:
              "outbound",

            action,
          })

        inventoryAdjustments.push(
          outboundAdjustment
        )
      }

      if (returnInventoryId) {
        if (
          returnInventoryId ===
          outboundInventoryId
        ) {
          throw new StatusUpdateError(
            409,
            "Outbound and return inventory IDs cannot be identical."
          )
        }

        const returnAdjustment =
          await adjustInventorySeats({
            inventoryId:
              returnInventoryId,

            passengerCount,
            transactionId,

            journey:
              "return",

            action,
          })

        inventoryAdjustments.push(
          returnAdjustment
        )
      }
    }

    const updatedBooking =
      await tablesDB.updateRow({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .bookingsTableId,

        rowId:
          bookingId,

        data: {
          bookingStatus:
            nextBookingStatus,

          paymentStatus:
            nextPaymentStatus,
        },

        transactionId,
      })

    await tablesDB.updateTransaction({
      transactionId,
      commit: true,
    })

    transactionId = null

    const outboundAdjustment =
      inventoryAdjustments.find(
        (adjustment) =>
          adjustment.journey ===
          "outbound"
      )

    const returnAdjustment =
      inventoryAdjustments.find(
        (adjustment) =>
          adjustment.journey ===
          "return"
      )

    return noStoreJson({
      success: true,

      booking: {
        id:
          cleanText(
            updatedBooking.$id
          ) || bookingId,

        bookingStatus:
          nextBookingStatus,

        paymentStatus:
          nextPaymentStatus,
      },

      /*
       * Field lama dipertahankan agar
       * client lama tetap kompatibel.
       */
      inventoryAdjusted:
        inventoryAdjustments.length >
        0,

      availableSeats:
        outboundAdjustment
          ?.availableSeats ??
        null,

      outboundInventory:
        outboundAdjustment ?? null,

      returnInventory:
        returnAdjustment ?? null,

      inventoryAdjustments,
    })
  } catch (error) {
    if (transactionId) {
      await rollbackTransaction(
        transactionId
      )
    }

    if (
      error instanceof
      StatusUpdateError
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

    console.error(
      "Atomic booking status update error:",
      error
    )

    if (errorCode === 409) {
      return noStoreJson(
        {
          success: false,

          error:
            "The booking or linked inventory changed while the status was being updated. Please reload and try again.",
        },
        409
      )
    }

    return noStoreJson(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : "Booking status could not be updated.",
      },
      500
    )
  }
}