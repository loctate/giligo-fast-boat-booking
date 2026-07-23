import "server-only"

const DEFAULT_SEAT_HOLD_DURATION_MINUTES =
  30

const MINIMUM_SEAT_HOLD_DURATION_MINUTES =
  5

const MAXIMUM_SEAT_HOLD_DURATION_MINUTES =
  24 * 60

export function getSeatHoldDurationMinutes(): number {
  const configuredValue =
    process.env
      .SEAT_HOLD_DURATION_MINUTES
      ?.trim()

  if (!configuredValue) {
    return DEFAULT_SEAT_HOLD_DURATION_MINUTES
  }

  const durationMinutes =
    Number(configuredValue)

  if (
    !Number.isInteger(durationMinutes) ||
    durationMinutes <
      MINIMUM_SEAT_HOLD_DURATION_MINUTES ||
    durationMinutes >
      MAXIMUM_SEAT_HOLD_DURATION_MINUTES
  ) {
    throw new Error(
      "SEAT_HOLD_DURATION_MINUTES must be an integer between 5 and 1440."
    )
  }

  return durationMinutes
}

export function createSeatHoldExpiresAt(
  currentTime = new Date()
): string {
  const currentTimestamp =
    currentTime.getTime()

  if (!Number.isFinite(currentTimestamp)) {
    throw new Error(
      "The current seat-hold time is invalid."
    )
  }

  const holdDurationMilliseconds =
    getSeatHoldDurationMinutes() *
    60 *
    1000

  return new Date(
    currentTimestamp +
      holdDurationMilliseconds
  ).toISOString()
}

export type MidtransSnapExpiry = {
  start_time: string
  unit: "minute"
  duration: number
}

const MIDTRANS_JAKARTA_OFFSET_MINUTES =
  7 * 60

function padDatePart(
  value: number
): string {
  return String(value).padStart(
    2,
    "0"
  )
}

export function getSeatHoldExpiryTimestamp(
  value: unknown
): number {
  const normalizedValue =
    typeof value === "string"
      ? value.trim()
      : ""

  const timestamp =
    Date.parse(normalizedValue)

  if (
    !normalizedValue ||
    !Number.isFinite(timestamp)
  ) {
    throw new Error(
      "The stored seat-hold expiry is invalid."
    )
  }

  return timestamp
}

function formatMidtransJakartaTime(
  value: Date
): string {
  const timestamp =
    value.getTime()

  if (!Number.isFinite(timestamp)) {
    throw new Error(
      "The Midtrans expiry start time is invalid."
    )
  }

  const jakartaTime =
    new Date(
      timestamp +
        MIDTRANS_JAKARTA_OFFSET_MINUTES *
          60 *
          1000
    )

  const year =
    jakartaTime.getUTCFullYear()

  const month =
    padDatePart(
      jakartaTime.getUTCMonth() + 1
    )

  const day =
    padDatePart(
      jakartaTime.getUTCDate()
    )

  const hours =
    padDatePart(
      jakartaTime.getUTCHours()
    )

  const minutes =
    padDatePart(
      jakartaTime.getUTCMinutes()
    )

  const seconds =
    padDatePart(
      jakartaTime.getUTCSeconds()
    )

  return (
    `${year}-${month}-${day} ` +
    `${hours}:${minutes}:${seconds} ` +
    "+0700"
  )
}

export function createMidtransSnapExpiry(
  seatHoldExpiresAt: unknown
): MidtransSnapExpiry {
  const expiryTimestamp =
    getSeatHoldExpiryTimestamp(
      seatHoldExpiresAt
    )

  const durationMinutes =
    getSeatHoldDurationMinutes()

  const startTimestamp =
    expiryTimestamp -
    durationMinutes *
      60 *
      1000

  return {
    start_time:
      formatMidtransJakartaTime(
        new Date(startTimestamp)
      ),

    unit:
      "minute",

    duration:
      durationMinutes,
  }
}
