import {
  D1BookingDalError,
  determineD1InventorySeatAction,
  updateD1BookingLifecycle,
} from "@/lib/d1-bookings"

import type {
  D1BookingStatus,
  D1PaymentStatus,
} from "@/lib/d1-bookings"

import {
  findD1BookingByCode,
  getD1BookingById,
} from "@/lib/d1-booking-readers"

import type {
  D1BookingRecord,
} from "@/lib/d1-booking-readers"

import {
  persistD1BookingPaymentReview,
} from "@/lib/d1-booking-payment-writes"

export type D1CallbackSeatAction =
  | "none"
  | "release-held"
  | "release-booked"
  | "add-held"
  | "add-booked"
  | "held-to-booked"
  | "booked-to-held"

export type D1CallbackAdapterErrorCode =
  | "INVALID_MUTATION"
  | "BOOKING_NOT_FOUND"
  | "BOOKING_REFERENCE_MISMATCH"
  | "LIFECYCLE_PLAN_MISMATCH"

export class D1CallbackLifecycleAdapterError
  extends Error {
  readonly code:
    D1CallbackAdapterErrorCode

  constructor(
    code:
      D1CallbackAdapterErrorCode,
    message: string,
  ) {
    super(message)

    this.name =
      "D1CallbackLifecycleAdapterError"

    this.code =
      code
  }
}

export interface D1CallbackLifecycleMutation {
  bookingId: string
  bookingCode: string

  currentBookingStatus:
    D1BookingStatus

  currentPaymentStatus:
    D1PaymentStatus

  seatAction:
    D1CallbackSeatAction

  nextBookingStatus:
    D1BookingStatus

  nextPaymentStatus:
    D1PaymentStatus

  paymentReviewRequired:
    boolean

  paymentReviewReason:
    string | null

  paymentReviewAt:
    string | null

  /*
   * Provider metadata is intentionally accepted
   * as part of the callback-processor contract.
   *
   * The storage adapter does not persist it in V1.
   */
  idempotencyKey?: unknown
  providerTrxId?: unknown
  providerSessionId?: unknown
  providerExternalId?: unknown
  providerTimestamp?: unknown
  paymentState?: unknown
  statusCode?: unknown
  transactionStatusCode?: unknown
  paidOff?: unknown
}

export interface D1CallbackLifecycleResult {
  duplicate: boolean
  applied: boolean

  manualReview?: boolean
  reason?: string

  seatAction?:
    D1CallbackSeatAction

  paymentReviewResolved?:
    boolean
}

function invalidMutation(
  message: string,
): never {
  throw new D1CallbackLifecycleAdapterError(
    "INVALID_MUTATION",
    message,
  )
}

function lifecycleChanged():
  never {
  throw new D1CallbackLifecycleAdapterError(
    "LIFECYCLE_PLAN_MISMATCH",
    "The callback lifecycle changed before the atomic update.",
  )
}

function cleanRequiredText(
  value: unknown,
  field: string,
): string {
  const normalized =
    typeof value === "string"
      ? value.trim()
      : ""

  if (!normalized) {
    invalidMutation(
      `${field} is required.`,
    )
  }

  return normalized
}

function nullableText(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  const normalized =
    String(value).trim()

  return normalized || null
}

function normalizeTimestamp(
  value: unknown,
  field: string,
): string {
  const normalized =
    cleanRequiredText(
      value,
      field,
    )

  const parsed =
    Date.parse(normalized)

  if (
    Number.isNaN(parsed)
  ) {
    invalidMutation(
      `${field} must be a valid timestamp.`,
    )
  }

  return new Date(
    parsed,
  ).toISOString()
}

function bookingStatus(
  value: unknown,
  field: string,
): D1BookingStatus {
  if (
    value === "Pending" ||
    value === "Confirmed" ||
    value === "Completed" ||
    value === "Cancelled"
  ) {
    return value
  }

  invalidMutation(
    `${field} is invalid.`,
  )
}

function paymentStatus(
  value: unknown,
  field: string,
): D1PaymentStatus {
  if (
    value === "Demo" ||
    value === "Pending" ||
    value === "Paid" ||
    value === "Refunded"
  ) {
    return value
  }

  invalidMutation(
    `${field} is invalid.`,
  )
}

function seatAction(
  value: unknown,
): D1CallbackSeatAction {
  if (
    value === "none" ||
    value === "release-held" ||
    value === "release-booked" ||
    value === "add-held" ||
    value === "add-booked" ||
    value === "held-to-booked" ||
    value === "booked-to-held"
  ) {
    return value
  }

  invalidMutation(
    "seatAction is invalid.",
  )
}

function mutationRecord(
  value: unknown,
): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    invalidMutation(
      "Callback lifecycle mutation must be an object.",
    )
  }

  return value as
    Record<string, unknown>
}

export function normalizeD1CallbackLifecycleMutation(
  value: unknown,
): D1CallbackLifecycleMutation {
  const raw =
    mutationRecord(
      value,
    )

  const normalized:
    D1CallbackLifecycleMutation = {
    bookingId:
      cleanRequiredText(
        raw.bookingId,
        "bookingId",
      ),

    bookingCode:
      cleanRequiredText(
        raw.bookingCode,
        "bookingCode",
      ).toUpperCase(),

    currentBookingStatus:
      bookingStatus(
        raw.currentBookingStatus,
        "currentBookingStatus",
      ),

    currentPaymentStatus:
      paymentStatus(
        raw.currentPaymentStatus,
        "currentPaymentStatus",
      ),

    seatAction:
      seatAction(
        raw.seatAction,
      ),

    nextBookingStatus:
      bookingStatus(
        raw.nextBookingStatus,
        "nextBookingStatus",
      ),

    nextPaymentStatus:
      paymentStatus(
        raw.nextPaymentStatus,
        "nextPaymentStatus",
      ),

    paymentReviewRequired:
      raw.paymentReviewRequired === true,

    paymentReviewReason:
      nullableText(
        raw.paymentReviewReason,
      ),

    paymentReviewAt:
      raw.paymentReviewAt === null ||
      raw.paymentReviewAt === undefined
        ? null
        : normalizeTimestamp(
            raw.paymentReviewAt,
            "paymentReviewAt",
          ),

    idempotencyKey:
      raw.idempotencyKey,

    providerTrxId:
      raw.providerTrxId,

    providerSessionId:
      raw.providerSessionId,

    providerExternalId:
      raw.providerExternalId,

    providerTimestamp:
      raw.providerTimestamp,

    paymentState:
      raw.paymentState,

    statusCode:
      raw.statusCode,

    transactionStatusCode:
      raw.transactionStatusCode,

    paidOff:
      raw.paidOff,
  }

  if (
    raw.paymentReviewRequired !== true &&
    raw.paymentReviewRequired !== false
  ) {
    invalidMutation(
      "paymentReviewRequired must be a boolean.",
    )
  }

  if (
    normalized.paymentReviewRequired
  ) {
    if (
      normalized.seatAction !==
        "none"
    ) {
      invalidMutation(
        "Payment-review mutation cannot adjust seats.",
      )
    }

    if (
      normalized.nextBookingStatus !==
        normalized.currentBookingStatus ||
      normalized.nextPaymentStatus !==
        normalized.currentPaymentStatus
    ) {
      invalidMutation(
        "Payment-review mutation cannot change lifecycle state.",
      )
    }

    if (
      !normalized
        .paymentReviewReason ||
      !normalized
        .paymentReviewAt
    ) {
      invalidMutation(
        "Payment-review mutation requires reason and timestamp.",
      )
    }
  } else if (
    normalized.paymentReviewReason !==
      null ||
    normalized.paymentReviewAt !==
      null
  ) {
    invalidMutation(
      "Non-review mutation cannot contain payment-review metadata.",
    )
  }

  return normalized
}

function hasLifecycleState(
  booking:
    D1BookingRecord,
  bookingState:
    D1BookingStatus,
  paymentState:
    D1PaymentStatus,
): boolean {
  return (
    booking.bookingStatus ===
      bookingState &&
    booking.paymentStatus ===
      paymentState
  )
}

function sameReview(
  booking:
    D1BookingRecord,
  reason: string,
): boolean {
  return (
    booking
      .paymentReviewRequired ===
      true &&
    (
      booking
        .paymentReviewReason ??
      ""
    ).trim() === reason
  )
}

function assertReference(
  booking:
    D1BookingRecord,
  mutation:
    D1CallbackLifecycleMutation,
): void {
  if (
    booking.bookingCode !==
      mutation.bookingCode
  ) {
    throw new D1CallbackLifecycleAdapterError(
      "BOOKING_REFERENCE_MISMATCH",
      "The transaction bookingCode no longer matches the callback reference.",
    )
  }
}

async function currentBooking(
  mutation:
    D1CallbackLifecycleMutation,
): Promise<D1BookingRecord> {
  const booking =
    await getD1BookingById(
      mutation.bookingId,
    )

  if (!booking) {
    throw new D1CallbackLifecycleAdapterError(
      "BOOKING_NOT_FOUND",
      "Callback booking could not be found.",
    )
  }

  assertReference(
    booking,
    mutation,
  )

  return booking
}

function isBusinessRace(
  error: unknown,
): boolean {
  return (
    error instanceof
      D1BookingDalError &&
    error.kind ===
      "BUSINESS_ASSERTION"
  )
}

export async function findD1CallbackBookingByCodeImpl(
  bookingCode: string,
): Promise<D1BookingRecord[]> {
  const normalizedCode =
    cleanRequiredText(
      bookingCode,
      "bookingCode",
    ).toUpperCase()

  const booking =
    await findD1BookingByCode(
      normalizedCode,
    )

  return booking
    ? [booking]
    : []
}

export async function applyD1CallbackLifecycleImpl(
  rawMutation: unknown,
): Promise<D1CallbackLifecycleResult> {
  const mutation =
    normalizeD1CallbackLifecycleMutation(
      rawMutation,
    )

  let booking =
    await currentBooking(
      mutation,
    )

  /*
   * Late-success/manual-review branch.
   *
   * Callback processor only sends this branch for
   * LATE_SUCCESS_AFTER_SEAT_RELEASE today.
   */
  if (
    mutation.paymentReviewRequired
  ) {
    const reason =
      mutation.paymentReviewReason as
        string

    const reviewAt =
      mutation.paymentReviewAt as
        string

    if (
      sameReview(
        booking,
        reason,
      )
    ) {
      return {
        duplicate: true,
        applied: false,
        manualReview: true,
        reason,
      }
    }

    if (
      !hasLifecycleState(
        booking,
        mutation.currentBookingStatus,
        mutation.currentPaymentStatus,
      )
    ) {
      lifecycleChanged()
    }

    try {
      await persistD1BookingPaymentReview({
        bookingId:
          mutation.bookingId,

        bookingCode:
          mutation.bookingCode,

        expectedBookingStatus:
          mutation
            .currentBookingStatus,

        expectedPaymentStatus:
          mutation
            .currentPaymentStatus,

        reason,
        reviewAt,
      })
    } catch (error) {
      if (
        !isBusinessRace(error)
      ) {
        throw error
      }

      booking =
        await currentBooking(
          mutation,
        )

      if (
        sameReview(
          booking,
          reason,
        )
      ) {
        return {
          duplicate: true,
          applied: false,
          manualReview: true,
          reason,
        }
      }

      lifecycleChanged()
    }

    return {
      duplicate: false,
      applied: true,
      manualReview: true,
      reason,
    }
  }

  /*
   * If another callback won the race and already
   * reached our exact target state, preserve the
   * current Appwrite duplicate semantics.
   */
  if (
    hasLifecycleState(
      booking,
      mutation.nextBookingStatus,
      mutation.nextPaymentStatus,
    ) &&
    !hasLifecycleState(
      booking,
      mutation.currentBookingStatus,
      mutation.currentPaymentStatus,
    )
  ) {
    return {
      duplicate: true,
      applied: false,
    }
  }

  /*
   * Any other state drift is not silently accepted.
   * A retried callback will be replanned by the
   * existing bridge callback processor using the
   * latest D1 booking state.
   */
  if (
    !hasLifecycleState(
      booking,
      mutation.currentBookingStatus,
      mutation.currentPaymentStatus,
    )
  ) {
    lifecycleChanged()
  }

  const expectedSeatAction =
    determineD1InventorySeatAction({
      currentStatus:
        mutation
          .currentBookingStatus,

      nextStatus:
        mutation
          .nextBookingStatus,
    })

  if (
    expectedSeatAction !==
      mutation.seatAction
  ) {
    lifecycleChanged()
  }

  try {
    const result =
      await updateD1BookingLifecycle({
        bookingId:
          booking.id,

        currentBookingStatus:
          booking.bookingStatus,

        currentPaymentStatus:
          booking.paymentStatus,

        currentPaymentReviewRequired:
          booking
            .paymentReviewRequired,

        tripType:
          booking.tripType,

        passengerCount:
          booking.passengerCount,

        tripInventoryId:
          booking.tripInventoryId,

        returnTripInventoryId:
          booking
            .returnTripInventoryId,

        nextBookingStatus:
          mutation
            .nextBookingStatus,

        nextPaymentStatus:
          mutation
            .nextPaymentStatus,

        resolvePaymentReview:
          false,
      })

    if (
      result.seatAction !==
        mutation.seatAction
    ) {
      throw new D1CallbackLifecycleAdapterError(
        "LIFECYCLE_PLAN_MISMATCH",
        "The D1 lifecycle seat action does not match the callback plan.",
      )
    }

    return {
      duplicate: false,
      applied: true,
      seatAction:
        result.seatAction,

      paymentReviewResolved:
        result
          .paymentReviewResolved,
    }
  } catch (error) {
    if (
      !isBusinessRace(error)
    ) {
      throw error
    }

    booking =
      await currentBooking(
        mutation,
      )

    if (
      hasLifecycleState(
        booking,
        mutation.nextBookingStatus,
        mutation.nextPaymentStatus,
      )
    ) {
      return {
        duplicate: true,
        applied: false,
      }
    }

    lifecycleChanged()
  }
}
