import {
  createHash,
  timingSafeEqual,
} from "node:crypto"

import {
  D1BookingDalError,
  expireD1HeldBooking,
} from "@/lib/d1-bookings"

import {
  listD1ExpiredPendingBookings,
} from "@/lib/d1-booking-readers"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_PROCESS_PER_RUN =
  20

type CleanupResult =
  | {
      state:
        "processed"
      bookingId: string
      bookingCode: string
      releasedSeats: number
      inventoryIds: string[]
    }
  | {
      state:
        "skipped"
      bookingId: string
      bookingCode: string
      reason: string
    }
  | {
      state:
        "failed"
      bookingId: string
      bookingCode: string
      reason: string
    }

class CleanupError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = "CleanupError"
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

function getCronSecret(): string {
  const secret =
    cleanText(
      process.env.CRON_SECRET
    )

  if (!secret) {
    throw new CleanupError(
      503,
      "The cleanup endpoint is not configured."
    )
  }

  if (secret.length < 32) {
    throw new CleanupError(
      503,
      "The cleanup endpoint secret is invalid."
    )
  }

  return secret
}

function secureTextEquals(
  first: string,
  second: string
): boolean {
  const firstHash =
    createHash("sha256")
      .update(first)
      .digest()

  const secondHash =
    createHash("sha256")
      .update(second)
      .digest()

  return timingSafeEqual(
    firstHash,
    secondHash
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
    !authorization ||
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

async function processCandidate(
  candidate: Awaited<
    ReturnType<
      typeof listD1ExpiredPendingBookings
    >
  >[number],
  nowTimestamp: number
): Promise<CleanupResult> {
  const bookingId =
    cleanText(
      candidate.id
    )

  const bookingCode =
    cleanText(
      candidate.bookingCode
    )

  const seatHoldExpiresAt =
    cleanText(
      candidate.seatHoldExpiresAt
    )

  if (
    !bookingId ||
    !seatHoldExpiresAt
  ) {
    return {
      state:
        "skipped",

      bookingId,
      bookingCode,

      reason:
        "Booking expiry data is incomplete.",
    }
  }

  try {
    const result =
      await expireD1HeldBooking({
        bookingId,

        expectedSeatHoldExpiresAt:
          seatHoldExpiresAt,

        passengerCount:
          candidate.passengerCount,

        tripInventoryId:
          candidate
            .tripInventoryId,

        returnTripInventoryId:
          candidate
            .returnTripInventoryId,

        nowTimestamp,
      })

    return {
      state:
        "processed",

      bookingId,
      bookingCode,

      releasedSeats:
        result.releasedSeats,

      inventoryIds:
        result.inventoryIds,
    }
  } catch (error) {
    if (
      error instanceof
        D1BookingDalError &&
      (
        error.kind ===
          "BUSINESS_ASSERTION" ||
        error.kind ===
          "BUSINESS_RULE"
      )
    ) {
      return {
        state:
          "skipped",

        bookingId,
        bookingCode,

        reason:
          "Booking is no longer eligible for expiry cleanup.",
      }
    }

    console.error(
      "Expired D1 booking cleanup candidate error:",
      error
    )

    return {
      state:
        "failed",

      bookingId,
      bookingCode,

      reason:
        "The expired booking could not be processed.",
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

    const rows =
      await listD1ExpiredPendingBookings({
        cutoff:
          startedAt.toISOString(),

        limit:
          MAX_PROCESS_PER_RUN + 1,
      })

    const scanLimitReached =
      rows.length >
      MAX_PROCESS_PER_RUN

    const candidates =
      rows.slice(
        0,
        MAX_PROCESS_PER_RUN
      )

    const results:
      CleanupResult[] = []

    for (
      const candidate
      of candidates
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
        rows.length,

      candidateCount:
        candidates.length,

      processedCount:
        processed.length,

      skippedCount:
        skipped.length,

      failedCount:
        failed.length,

      scanLimitReached,

      processLimit:
        MAX_PROCESS_PER_RUN,

      results,
    })
  } catch (error) {
    console.error(
      "Expired held D1 booking cleanup endpoint error:",
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
