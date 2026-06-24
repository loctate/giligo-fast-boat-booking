const BALI_TIME_ZONE = "Asia/Makassar"

type DateParts = {
  year: number
  month: number
  day: number
}

function getDatePartsInTimeZone(
  date: Date,
  timeZone: string
): DateParts {
  const formatter = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  )

  const parts = formatter.formatToParts(date)

  const year = Number(
    parts.find((part) => part.type === "year")
      ?.value
  )

  const month = Number(
    parts.find((part) => part.type === "month")
      ?.value
  )

  const day = Number(
    parts.find((part) => part.type === "day")
      ?.value
  )

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    throw new Error(
      "Could not determine the Bali calendar date."
    )
  }

  return {
    year,
    month,
    day,
  }
}

function formatDateParts(
  dateParts: DateParts
): string {
  const year = String(dateParts.year)

  const month = String(
    dateParts.month
  ).padStart(2, "0")

  const day = String(
    dateParts.day
  ).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function addCalendarDays(
  dateParts: DateParts,
  numberOfDays: number
): DateParts {
  const utcDate = new Date(
    Date.UTC(
      dateParts.year,
      dateParts.month - 1,
      dateParts.day + numberOfDays
    )
  )

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  }
}

export function getCurrentBaliDate(
  now: Date = new Date()
): string {
  return formatDateParts(
    getDatePartsInTimeZone(
      now,
      BALI_TIME_ZONE
    )
  )
}

export function getMinimumBookableDate(
  now: Date = new Date()
): string {
  const baliToday =
    getDatePartsInTimeZone(
      now,
      BALI_TIME_ZONE
    )

  return formatDateParts(
    addCalendarDays(baliToday, 2)
  )
}

export function isValidDateOnly(
  value: unknown
): value is string {
  if (typeof value !== "string") {
    return false
  }

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (!match) {
    return false
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  const parsedDate = new Date(
    Date.UTC(year, month - 1, day)
  )

  return (
    parsedDate.getUTCFullYear() === year &&
    parsedDate.getUTCMonth() === month - 1 &&
    parsedDate.getUTCDate() === day
  )
}

export function isDateOnOrAfter(
  date: string,
  minimumDate: string
): boolean {
  return date >= minimumDate
}

export function validateCustomerTravelDate(
  travelDate: unknown,
  now: Date = new Date()
):
  | {
      valid: true
      travelDate: string
      minimumDate: string
    }
  | {
      valid: false
      minimumDate: string
      error: string
    } {
  const minimumDate =
    getMinimumBookableDate(now)

  if (!isValidDateOnly(travelDate)) {
    return {
      valid: false,
      minimumDate,
      error:
        "Travel date must use a valid YYYY-MM-DD format.",
    }
  }

  if (
    !isDateOnOrAfter(
      travelDate,
      minimumDate
    )
  ) {
    return {
      valid: false,
      minimumDate,
      error:
        `The earliest available booking date is ${minimumDate} based on Bali time.`,
    }
  }

  return {
    valid: true,
    travelDate,
    minimumDate,
  }
}
