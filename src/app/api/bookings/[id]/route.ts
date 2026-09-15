import {
  getCurrentAdmin,
} from "@/lib/admin-auth"

import {
  D1BookingDalError,
  getD1InventoryMutationSnapshot,
  updateD1BookingLifecycle,
  type D1BookingStatus,
  type D1PaymentStatus,
} from "@/lib/d1-bookings"

import {
  getD1BookingById,
} from "@/lib/d1-booking-readers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type UpdateBookingRequest = {
  bookingStatus?: unknown
  paymentStatus?: unknown
  resolvePaymentReview?: unknown
}

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

type Journey =
  | "outbound"
  | "return"

type InventoryAdjustment = {
  journey: Journey
  inventoryId: string
  adjusted: true
  availableSeats: number
  salesStatus: string
}

class StatusUpdateError
  extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name =
      "StatusUpdateError"
  }
}

const BOOKING_STATUSES:
  readonly D1BookingStatus[] = [
    "Pending",
    "Confirmed",
    "Completed",
    "Cancelled",
  ]

const PAYMENT_STATUSES:
  readonly D1PaymentStatus[] = [
    "Demo",
    "Pending",
    "Paid",
    "Refunded",
  ]

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
  return String(
    value ?? ""
  ).trim()
}

function isBookingStatus(
  value: string
): value is D1BookingStatus {
  return (
    BOOKING_STATUSES as
      readonly string[]
  ).includes(value)
}

function isPaymentStatus(
  value: string
): value is D1PaymentStatus {
  return (
    PAYMENT_STATUSES as
      readonly string[]
  ).includes(value)
}

async function toInventoryAdjustment(
  journey: Journey,
  inventoryId: string
): Promise<InventoryAdjustment> {
  const snapshot =
    await getD1InventoryMutationSnapshot(
      inventoryId
    )

  if (!snapshot) {
    throw new StatusUpdateError(
      409,
      `The ${journey} inventory could not be found after the booking update.`
    )
  }

  const availableSeats =
    snapshot.seatCapacity -
    snapshot.bookedSeats -
    snapshot.heldSeats

  return {
    journey,
    inventoryId,

    adjusted:
      true,

    availableSeats,

    salesStatus:
      snapshot.salesStatus,
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext
) {
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
        (await request.json()) as
          UpdateBookingRequest
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

    const resolvePaymentReviewRequested =
      body.resolvePaymentReview ===
      true

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

    const booking =
      await getD1BookingById(
        bookingId
      )

    if (!booking) {
      throw new StatusUpdateError(
        404,
        "Booking could not be found."
      )
    }

    const result =
      await updateD1BookingLifecycle({
        bookingId:

          booking.id,

        currentBookingStatus:
          booking.bookingStatus,

        currentPaymentStatus:
          booking.paymentStatus,

        currentPaymentReviewRequired:
          booking.paymentReviewRequired,

        tripType:
          booking.tripType,

        passengerCount:
          booking.passengerCount,

        tripInventoryId:
          booking.tripInventoryId,

        returnTripInventoryId:
          booking
            .returnTripInventoryId,

        nextBookingStatus,
        nextPaymentStatus,

        resolvePaymentReview:
          resolvePaymentReviewRequested,
      })

    const inventoryAdjustments:
      InventoryAdjustment[] = []

    if (
      result.seatAction !==
      "none"
    ) {
      inventoryAdjustments.push(
        await toInventoryAdjustment(
          "outbound",
          booking.tripInventoryId
        )
      )

      if (
        booking.returnTripInventoryId
      ) {
        inventoryAdjustments.push(
          await toInventoryAdjustment(
            "return",
            booking
              .returnTripInventoryId
          )
        )
      }
    }

    const outboundAdjustment =
      inventoryAdjustments.find(
        (adjustment) =>
          adjustment.journey ===
          "outbound"
      ) ?? null

    const returnAdjustment =
      inventoryAdjustments.find(
        (adjustment) =>
          adjustment.journey ===
          "return"
      ) ?? null

    return noStoreJson({
      success: true,

      booking: {
        id:
          booking.id,

        bookingStatus:
          nextBookingStatus,

        paymentStatus:
          nextPaymentStatus,

        paymentReviewResolved:
          result
            .paymentReviewResolved,
      },

      inventoryAdjusted:
        inventoryAdjustments.length >
        0,

      availableSeats:
        outboundAdjustment
          ?.availableSeats ??
        null,

      outboundInventory:
        outboundAdjustment,

      returnInventory:
        returnAdjustment,

      inventoryAdjustments,
    })
  } catch (error) {
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

    if (
      error instanceof
      D1BookingDalError
    ) {
      if (
        error.kind ===
          "BUSINESS_RULE"
      ) {
        return noStoreJson(
          {
            success: false,
            error:
              error.message,
          },
          409
        )
      }

      if (
        error.kind ===
          "BUSINESS_ASSERTION" ||
        error.kind ===
          "SEAT_CONSTRAINT"
      ) {
        return noStoreJson(
          {
            success: false,
            error:
              "The booking or linked inventory changed while the status was being updated. Please reload and try again.",
          },
          409
        )
      }
    }

    console.error(
      "Atomic D1 booking status update error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          "Booking status could not be updated.",
      },
      500
    )
  }
}
