export class PaymentReviewResolutionError
  extends Error {
  constructor(message: string) {
    super(message)
    this.name =
      "PaymentReviewResolutionError"
  }
}

type PaymentReviewResolutionInput = {
  reviewRequired: boolean
  resolveRequested: boolean
  bookingStatus: string
  paymentStatus: string
}

type PaymentReviewResolution = {
  resolved: boolean
  bookingUpdate: {
    paymentReviewRequired: false
  } | null
}

export function isFinalPaymentReviewState(
  bookingStatus: string,
  paymentStatus: string
): boolean {
  return (
    (
      bookingStatus === "Confirmed" &&
      paymentStatus === "Paid"
    ) ||
    (
      bookingStatus === "Cancelled" &&
      paymentStatus === "Refunded"
    )
  )
}

export function resolvePaymentReview({
  reviewRequired,
  resolveRequested,
  bookingStatus,
  paymentStatus,
}: PaymentReviewResolutionInput):
  PaymentReviewResolution {
  if (!resolveRequested) {
    return {
      resolved: false,
      bookingUpdate: null,
    }
  }

  if (!reviewRequired) {
    throw new PaymentReviewResolutionError(
      "This booking does not currently require payment review."
    )
  }

  if (
    !isFinalPaymentReviewState(
      bookingStatus,
      paymentStatus
    )
  ) {
    throw new PaymentReviewResolutionError(
      "Payment review can only be resolved as Confirmed + Paid or Cancelled + Refunded."
    )
  }

  return {
    resolved: true,
    bookingUpdate: {
      paymentReviewRequired: false,
    },
  }
}
