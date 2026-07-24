import "server-only"

const DEFAULT_SEAT_HOLD_DURATION_MINUTES = 30
const MINIMUM_SEAT_HOLD_DURATION_MINUTES = 5
const MAXIMUM_SEAT_HOLD_DURATION_MINUTES =
  24 * 60

export function getSeatHoldDurationMinutes(): number {
  const configuredValue =
    process.env.SEAT_HOLD_DURATION_MINUTES?.trim()

  if (!configuredValue) {
    return DEFAULT_SEAT_HOLD_DURATION_MINUTES
  }

  const durationMinutes = Number(configuredValue)

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
  const currentTimestamp = currentTime.getTime()

  if (!Number.isFinite(currentTimestamp)) {
    throw new Error(
      "The current seat-hold time is invalid."
    )
  }

  const holdDurationMilliseconds =
    getSeatHoldDurationMinutes() * 60 * 1000

  return new Date(
    currentTimestamp + holdDurationMilliseconds
  ).toISOString()
}

export function getSeatHoldExpiryTimestamp(
  value: unknown
): number {
  const normalizedValue =
    typeof value === "string"
      ? value.trim()
      : ""

  const timestamp = Date.parse(normalizedValue)

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
