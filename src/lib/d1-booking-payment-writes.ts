import {
  REFUND_POLICY_VERSION,
  TERMS_POLICY_VERSION,
} from "@/lib/booking-policy"

import {
  buildD1DeleteAssertion,
  makeD1BookingAssertionToken,
  toD1BookingDalError,
} from "@/lib/d1-bookings"

import type {
  D1BookingStatus,
  D1PaymentStatus,
} from "@/lib/d1-bookings"

import {
  getD1,
} from "@/lib/d1-server"

function cleanRequiredText(
  value: string,
  field: string,
): string {
  const normalized =
    String(value ?? "").trim()

  if (!normalized) {
    throw new TypeError(
      `${field} is required.`,
    )
  }

  return normalized
}

function normalizedEmail(
  value: string,
): string {
  return cleanRequiredText(
    value,
    "Customer email",
  ).toLowerCase()
}

function isoTimestamp(
  value: string,
  field: string,
): string {
  const normalized =
    cleanRequiredText(
      value,
      field,
    )

  const timestamp =
    Date.parse(normalized)

  if (
    Number.isNaN(timestamp)
  ) {
    throw new TypeError(
      `${field} must be a valid timestamp.`,
    )
  }

  return new Date(
    timestamp,
  ).toISOString()
}

export interface D1PolicyAcceptanceInput {
  bookingId: string
  bookingCode: string
  customerEmail: string
  acceptedAt: string
}

export interface D1PolicyAcceptanceResult {
  termsVersion: string
  refundPolicyVersion: string
  acceptedAt: string
}

export function buildD1PolicyAcceptanceAssertion(
  db: D1Database,
  {
    token,
    bookingId,
    bookingCode,
    customerEmail,
  }: {
    token: string
    bookingId: string
    bookingCode: string
    customerEmail: string
  },
): D1PreparedStatement {
  return db
    .prepare(`
      INSERT INTO
        d1_transaction_assertions (
          token,
          ok
        )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM bookings
            WHERE id = ?
              AND bookingCode = ?
              AND lower(customerEmail) = ?
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      cleanRequiredText(
        token,
        "Assertion token",
      ),
      cleanRequiredText(
        bookingId,
        "Booking ID",
      ),
      cleanRequiredText(
        bookingCode,
        "Booking code",
      ).toUpperCase(),
      normalizedEmail(
        customerEmail,
      ),
    )
}

export function buildD1PolicyAcceptanceUpdate(
  db: D1Database,
  {
    bookingId,
    bookingCode,
    customerEmail,
    acceptedAt,
  }: D1PolicyAcceptanceInput,
): D1PreparedStatement {
  const normalizedAcceptedAt =
    isoTimestamp(
      acceptedAt,
      "Policy accepted at",
    )

  return db
    .prepare(`
      UPDATE bookings
      SET
        termsAcceptedAt =
          CASE
            WHEN
              termsAcceptedAt IS NOT NULL
              AND refundPolicyAcceptedAt IS NOT NULL
              AND termsVersion = ?
              AND refundPolicyVersion = ?
            THEN termsAcceptedAt
            ELSE ?
          END,

        refundPolicyAcceptedAt =
          CASE
            WHEN
              termsAcceptedAt IS NOT NULL
              AND refundPolicyAcceptedAt IS NOT NULL
              AND termsVersion = ?
              AND refundPolicyVersion = ?
            THEN refundPolicyAcceptedAt
            ELSE ?
          END,

        termsVersion = ?,
        refundPolicyVersion = ?

      WHERE id = ?
        AND bookingCode = ?
        AND lower(customerEmail) = ?
    `)
    .bind(
      TERMS_POLICY_VERSION,
      REFUND_POLICY_VERSION,
      normalizedAcceptedAt,

      TERMS_POLICY_VERSION,
      REFUND_POLICY_VERSION,
      normalizedAcceptedAt,

      TERMS_POLICY_VERSION,
      REFUND_POLICY_VERSION,

      cleanRequiredText(
        bookingId,
        "Booking ID",
      ),

      cleanRequiredText(
        bookingCode,
        "Booking code",
      ).toUpperCase(),

      normalizedEmail(
        customerEmail,
      ),
    )
}

export async function acceptD1CurrentBookingPolicies(
  input: D1PolicyAcceptanceInput,
): Promise<D1PolicyAcceptanceResult> {
  const db =
    getD1()

  const token =
    makeD1BookingAssertionToken(
      "booking-policy-acceptance",
    )

  const acceptedAt =
    isoTimestamp(
      input.acceptedAt,
      "Policy accepted at",
    )

  try {
    await db.batch([
      buildD1PolicyAcceptanceAssertion(
        db,
        {
          token,
          bookingId:
            input.bookingId,
          bookingCode:
            input.bookingCode,
          customerEmail:
            input.customerEmail,
        },
      ),

      buildD1PolicyAcceptanceUpdate(
        db,
        {
          ...input,
          acceptedAt,
        },
      ),

      buildD1DeleteAssertion(
        db,
        token,
      ),
    ])
  } catch (error) {
    throw toD1BookingDalError(
      error,
    )
  }

  return {
    termsVersion:
      TERMS_POLICY_VERSION,

    refundPolicyVersion:
      REFUND_POLICY_VERSION,

    acceptedAt,
  }
}

export interface D1PaymentReviewMetadataInput {
  bookingId: string
  bookingCode: string

  expectedBookingStatus:
    D1BookingStatus

  expectedPaymentStatus:
    D1PaymentStatus

  reason: string
  reviewAt: string
}

export interface D1PaymentReviewMetadataResult {
  paymentReviewRequired: true
  paymentReviewReason: string
  paymentReviewAt: string
}

export function buildD1PaymentReviewAssertion(
  db: D1Database,
  {
    token,
    bookingId,
    bookingCode,
    expectedBookingStatus,
    expectedPaymentStatus,
    reason,
    reviewAt,
  }: D1PaymentReviewMetadataInput & {
    token: string
  },
): D1PreparedStatement {
  const normalizedReason =
    cleanRequiredText(
      reason,
      "Payment review reason",
    )

  const normalizedReviewAt =
    isoTimestamp(
      reviewAt,
      "Payment review at",
    )

  return db
    .prepare(`
      INSERT INTO
        d1_transaction_assertions (
          token,
          ok
        )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM bookings
            WHERE id = ?
              AND bookingCode = ?
              AND bookingStatus = ?
              AND paymentStatus = ?
              AND (
                paymentReviewRequired = 0

                OR (
                  paymentReviewRequired = 1
                  AND paymentReviewReason = ?
                  AND paymentReviewAt = ?
                )
              )
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      cleanRequiredText(
        token,
        "Assertion token",
      ),

      cleanRequiredText(
        bookingId,
        "Booking ID",
      ),

      cleanRequiredText(
        bookingCode,
        "Booking code",
      ).toUpperCase(),

      expectedBookingStatus,
      expectedPaymentStatus,

      normalizedReason,
      normalizedReviewAt,
    )
}

export function buildD1PaymentReviewMetadataUpdate(
  db: D1Database,
  input: D1PaymentReviewMetadataInput,
): D1PreparedStatement {
  const reason =
    cleanRequiredText(
      input.reason,
      "Payment review reason",
    )

  const reviewAt =
    isoTimestamp(
      input.reviewAt,
      "Payment review at",
    )

  return db
    .prepare(`
      UPDATE bookings
      SET
        paymentReviewRequired = 1,
        paymentReviewReason = ?,
        paymentReviewAt = ?
      WHERE id = ?
        AND bookingCode = ?
        AND bookingStatus = ?
        AND paymentStatus = ?
        AND (
          paymentReviewRequired = 0

          OR (
            paymentReviewRequired = 1
            AND paymentReviewReason = ?
            AND paymentReviewAt = ?
          )
        )
    `)
    .bind(
      reason,
      reviewAt,

      cleanRequiredText(
        input.bookingId,
        "Booking ID",
      ),

      cleanRequiredText(
        input.bookingCode,
        "Booking code",
      ).toUpperCase(),

      input.expectedBookingStatus,
      input.expectedPaymentStatus,

      reason,
      reviewAt,
    )
}

export async function persistD1BookingPaymentReview(
  input: D1PaymentReviewMetadataInput,
): Promise<D1PaymentReviewMetadataResult> {
  const db =
    getD1()

  const token =
    makeD1BookingAssertionToken(
      "booking-payment-review",
    )

  const reason =
    cleanRequiredText(
      input.reason,
      "Payment review reason",
    )

  const reviewAt =
    isoTimestamp(
      input.reviewAt,
      "Payment review at",
    )

  try {
    await db.batch([
      buildD1PaymentReviewAssertion(
        db,
        {
          ...input,
          token,
          reason,
          reviewAt,
        },
      ),

      buildD1PaymentReviewMetadataUpdate(
        db,
        {
          ...input,
          reason,
          reviewAt,
        },
      ),

      buildD1DeleteAssertion(
        db,
        token,
      ),
    ])
  } catch (error) {
    throw toD1BookingDalError(
      error,
    )
  }

  return {
    paymentReviewRequired:
      true,

    paymentReviewReason:
      reason,

    paymentReviewAt:
      reviewAt,
  }
}
