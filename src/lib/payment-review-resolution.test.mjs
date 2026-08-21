import assert from "node:assert/strict"
import test from "node:test"

import {
  PaymentReviewResolutionError,
  isFinalPaymentReviewState,
  resolvePaymentReview,
} from "./payment-review-resolution.ts"

test(
  "normal save leaves payment review unchanged",
  () => {
    const result =
      resolvePaymentReview({
        reviewRequired: true,
        resolveRequested: false,
        bookingStatus: "Cancelled",
        paymentStatus: "Paid",
      })

    assert.deepEqual(
      result,
      {
        resolved: false,
        bookingUpdate: null,
      }
    )
  }
)

test(
  "Confirmed Paid is a final review state",
  () => {
    assert.equal(
      isFinalPaymentReviewState(
        "Confirmed",
        "Paid"
      ),
      true
    )
  }
)

test(
  "Cancelled Refunded is a final review state",
  () => {
    assert.equal(
      isFinalPaymentReviewState(
        "Cancelled",
        "Refunded"
      ),
      true
    )
  }
)

test(
  "Cancelled Paid remains unresolved",
  () => {
    assert.equal(
      isFinalPaymentReviewState(
        "Cancelled",
        "Paid"
      ),
      false
    )
  }
)

test(
  "Cancelled Pending remains unresolved",
  () => {
    assert.equal(
      isFinalPaymentReviewState(
        "Cancelled",
        "Pending"
      ),
      false
    )
  }
)

test(
  "Confirmed Paid resolves active review",
  () => {
    const result =
      resolvePaymentReview({
        reviewRequired: true,
        resolveRequested: true,
        bookingStatus: "Confirmed",
        paymentStatus: "Paid",
      })

    assert.deepEqual(
      result,
      {
        resolved: true,
        bookingUpdate: {
          paymentReviewRequired: false,
        },
      }
    )
  }
)

test(
  "Cancelled Refunded resolves active review",
  () => {
    const result =
      resolvePaymentReview({
        reviewRequired: true,
        resolveRequested: true,
        bookingStatus: "Cancelled",
        paymentStatus: "Refunded",
      })

    assert.deepEqual(
      result,
      {
        resolved: true,
        bookingUpdate: {
          paymentReviewRequired: false,
        },
      }
    )
  }
)

test(
  "explicit resolution rejects unfinished state",
  () => {
    assert.throws(
      () =>
        resolvePaymentReview({
          reviewRequired: true,
          resolveRequested: true,
          bookingStatus: "Cancelled",
          paymentStatus: "Paid",
        }),
      /Confirmed \+ Paid or Cancelled \+ Refunded/
    )
  }
)

test(
  "explicit resolution rejects booking without active review",
  () => {
    assert.throws(
      () =>
        resolvePaymentReview({
          reviewRequired: false,
          resolveRequested: true,
          bookingStatus: "Confirmed",
          paymentStatus: "Paid",
        }),
      (
        error
      ) => {
        assert.ok(
          error instanceof
            PaymentReviewResolutionError
        )

        assert.equal(
          error.message,
          "This booking does not currently require payment review."
        )

        return true
      }
    )
  }
)

test(
  "helper never mutates reason or timestamp",
  () => {
    const result =
      resolvePaymentReview({
        reviewRequired: true,
        resolveRequested: true,
        bookingStatus: "Cancelled",
        paymentStatus: "Refunded",
      })

    assert.equal(
      "paymentReviewReason" in
        (result.bookingUpdate ?? {}),
      false
    )

    assert.equal(
      "paymentReviewAt" in
        (result.bookingUpdate ?? {}),
      false
    )
  }
)
