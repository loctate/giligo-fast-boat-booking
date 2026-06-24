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

type UpdateBookingRequest = {
  bookingStatus?: unknown
  paymentStatus?: unknown
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type AppwriteRow = Record<string, unknown> & {
  $id?: string
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
      (error as { code?: unknown }).code
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
  const transitions:
    Record<BookingStatus, BookingStatus[]> = {
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
    const row = await tablesDB.getRow({
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

export async function PATCH(
  request: Request,
  context: RouteContext
) {
  let transactionId: string | null = null

  try {
    const admin =
      await getCurrentAdmin()

    if (!admin) {
      throw new StatusUpdateError(
        401,
        "Unauthorized. Please sign in as admin."
      )
    }

    const { id } = await context.params

    const bookingId = cleanText(id)

    if (!bookingId) {
      throw new StatusUpdateError(
        400,
        "Booking ID is required."
      )
    }

    const body =
      (await request.json()) as
        UpdateBookingRequest

    const nextBookingStatus =
      cleanText(body.bookingStatus)

    const nextPaymentStatus =
      cleanText(body.paymentStatus)

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

    transactionId = cleanText(
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
        appwriteConfig.bookingsTableId,
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

    const tripInventoryId =
      cleanText(
        booking.tripInventoryId
      )

    let inventoryAdjusted = false
    let availableSeats:
      number | null = null

    /*
     * Booking lama yang tidak memiliki
     * tripInventoryId tetap boleh diubah
     * statusnya, tetapi tidak mengubah
     * Trip Inventory.
     */
    if (
      tripInventoryId &&
      (isCancelling ||
        isReactivating)
    ) {
      const passengerCount =
        toInteger(
          booking.passengerCount
        )

      if (
        passengerCount === null ||
        passengerCount < 1
      ) {
        throw new StatusUpdateError(
          409,
          "The booking has an invalid passenger count."
        )
      }

      const inventory =
        await getTransactionRow(
          appwriteConfig
            .tripInventoryTableId,

          tripInventoryId,
          transactionId,

          "The booking inventory could not be found."
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
          "The linked inventory has invalid seat data."
        )
      }

      const salesStatus =
        cleanText(
          inventory.salesStatus
        ).toUpperCase()

      if (isCancelling) {
        if (
          bookedSeats <
          passengerCount
        ) {
          throw new StatusUpdateError(
            409,
            "The inventory booked-seat count is lower than this booking passenger count."
          )
        }

        await tablesDB.decrementRowColumn({
          databaseId:
            appwriteConfig.databaseId,

          tableId:
            appwriteConfig
              .tripInventoryTableId,

          rowId:
            tripInventoryId,

          column:
            "bookedSeats",

          value:
            passengerCount,

          min:
            0,

          transactionId,
        })

        const nextBookedSeats =
          bookedSeats -
          passengerCount

        availableSeats =
          seatCapacity -
          nextBookedSeats -
          heldSeats

        /*
         * Jika sebelumnya SOLD_OUT dan
         * pembatalan membuat kursi tersedia,
         * inventory dibuka kembali.
         */
        if (
          salesStatus ===
            "SOLD_OUT" &&
          availableSeats > 0
        ) {
          await tablesDB.updateRow({
            databaseId:
              appwriteConfig.databaseId,

            tableId:
              appwriteConfig
                .tripInventoryTableId,

            rowId:
              tripInventoryId,

            data: {
              salesStatus:
                "OPEN",
            },

            transactionId,
          })
        }

        inventoryAdjusted = true
      }

      if (isReactivating) {
        if (
          inventory.isActive !==
          true
        ) {
          throw new StatusUpdateError(
            409,
            "The linked inventory is inactive and cannot accept this booking."
          )
        }

        if (
          salesStatus ===
            "CLOSED" ||
          salesStatus ===
            "CANCELLED"
        ) {
          throw new StatusUpdateError(
            409,
            "The linked inventory is not open for reactivation."
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
              ? "The linked inventory is sold out."
              : `Only ${currentAvailableSeats} seats remain in the linked inventory.`
          )
        }

        await tablesDB.incrementRowColumn({
          databaseId:
            appwriteConfig.databaseId,

          tableId:
            appwriteConfig
              .tripInventoryTableId,

          rowId:
            tripInventoryId,

          column:
            "bookedSeats",

          value:
            passengerCount,

          max:
            seatCapacity -
            heldSeats,

          transactionId,
        })

        const nextBookedSeats =
          bookedSeats +
          passengerCount

        availableSeats =
          seatCapacity -
          nextBookedSeats -
          heldSeats

        if (
          availableSeats <= 0 &&
          salesStatus ===
            "OPEN"
        ) {
          await tablesDB.updateRow({
            databaseId:
              appwriteConfig.databaseId,

            tableId:
              appwriteConfig
                .tripInventoryTableId,

            rowId:
              tripInventoryId,

            data: {
              salesStatus:
                "SOLD_OUT",
            },

            transactionId,
          })
        }

        inventoryAdjusted = true
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

      inventoryAdjusted,
      availableSeats,
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
          error: error.message,
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
            "The booking or inventory changed while the status was being updated. Please reload and try again.",
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
