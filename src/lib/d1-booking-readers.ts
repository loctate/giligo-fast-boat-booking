import { getD1 } from "@/lib/d1-server"

export type D1ReadableBookingStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled"

export type D1ReadablePaymentStatus =
  | "Demo"
  | "Pending"
  | "Paid"
  | "Refunded"

export type D1ReadableTripType =
  | "one-way"
  | "round-trip"

export type D1BookingJourneyLeg =
  | "outbound"
  | "return"

export class D1BookingReadError extends Error {
  constructor(
    public readonly kind:
      | "INVALID_ROW"
      | "DATABASE",
    message: string,
    options?: {
      cause?: unknown
    }
  ) {
    super(message, options)

    this.name =
      "D1BookingReadError"
  }
}

export interface D1BookingRecord {
  id: string
  bookingCode: string

  bookingStatus:
    D1ReadableBookingStatus

  paymentStatus:
    D1ReadablePaymentStatus

  seatHoldExpiresAt:
    string | null

  paymentVerificationAllowed:
    boolean

  paymentReviewRequired:
    boolean

  paymentReviewReason:
    string | null

  paymentReviewAt:
    string | null

  termsAcceptedAt:
    string | null

  refundPolicyAcceptedAt:
    string | null

  termsVersion:
    string | null

  refundPolicyVersion:
    string | null

  tripType:
    D1ReadableTripType

  departureDate: string
  returnDate:
    string | null

  passengerCount: number
  totalPrice: number

  customerFullName: string
  customerEmail: string
  customerWhatsapp: string
  customerCountry: string

  passengersJson: string

  tripId: string
  tripInventoryId: string

  returnTripInventoryId:
    string | null

  inventoryCode: string
  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  operatorName: string
  vesselName: string
  routeCode: string

  fromPort: string
  toPort: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  duration: string

  pricePerPassenger: number
  currency: string
  checkInLocation: string

  returnTripJson:
    string | null

  notes:
    string | null

  createdAt: string
  updatedAt: string
}

export interface D1InventoryLinkedBooking {
  booking:
    D1BookingRecord

  journeyLeg:
    D1BookingJourneyLeg
}

export interface D1BookingListOptions {
  limit?: number
}

export interface D1ExpiredPendingBookingListOptions
  extends D1BookingListOptions {
  cutoff: string
}

const BOOKING_SELECT_COLUMNS = `
  id,
  bookingCode,
  bookingStatus,
  paymentStatus,
  seatHoldExpiresAt,
  paymentVerificationAllowed,
  paymentReviewRequired,
  paymentReviewReason,
  paymentReviewAt,
  termsAcceptedAt,
  refundPolicyAcceptedAt,
  termsVersion,
  refundPolicyVersion,
  tripType,
  departureDate,
  returnDate,
  passengerCount,
  totalPrice,
  customerFullName,
  customerEmail,
  customerWhatsapp,
  customerCountry,
  passengersJson,
  tripId,
  tripInventoryId,
  returnTripInventoryId,
  inventoryCode,
  scheduleId,
  operatorId,
  vesselId,
  routeId,
  operatorName,
  vesselName,
  routeCode,
  fromPort,
  toPort,
  departureTime,
  arrivalTime,
  arrivalDayOffset,
  duration,
  pricePerPassenger,
  currency,
  checkInLocation,
  returnTripJson,
  notes,
  createdAt,
  updatedAt
`

function invalidRow(
  field: string,
  value: unknown
): never {
  throw new D1BookingReadError(
    "INVALID_ROW",
    `D1 booking row has invalid ${field}. Received: ${String(
      value
    )}`
  )
}

function requiredText(
  value: unknown,
  field: string
): string {
  if (typeof value !== "string") {
    return invalidRow(
      field,
      value
    )
  }

  const normalized =
    value.trim()

  if (!normalized) {
    return invalidRow(
      field,
      value
    )
  }

  return normalized
}

function nullableText(
  value: unknown,
  field: string
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null
  }

  if (typeof value !== "string") {
    return invalidRow(
      field,
      value
    )
  }

  const normalized =
    value.trim()

  return normalized || null
}

function integerValue(
  value: unknown,
  field: string,
  minimum: number
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < minimum
  ) {
    return invalidRow(
      field,
      value
    )
  }

  return value
}

function booleanValue(
  value: unknown,
  field: string
): boolean {
  if (
    value === true ||
    value === 1
  ) {
    return true
  }

  if (
    value === false ||
    value === 0
  ) {
    return false
  }

  return invalidRow(
    field,
    value
  )
}

function bookingStatusValue(
  value: unknown
): D1ReadableBookingStatus {
  if (
    value === "Pending" ||
    value === "Confirmed" ||
    value === "Completed" ||
    value === "Cancelled"
  ) {
    return value
  }

  return invalidRow(
    "bookingStatus",
    value
  )
}

function paymentStatusValue(
  value: unknown
): D1ReadablePaymentStatus {
  if (
    value === "Demo" ||
    value === "Pending" ||
    value === "Paid" ||
    value === "Refunded"
  ) {
    return value
  }

  return invalidRow(
    "paymentStatus",
    value
  )
}

function tripTypeValue(
  value: unknown
): D1ReadableTripType {
  if (
    value === "one-way" ||
    value === "round-trip"
  ) {
    return value
  }

  return invalidRow(
    "tripType",
    value
  )
}

function normalizeLimit(
  value: number | undefined,
  fallback: number,
  maximum: number
): number {
  if (value === undefined) {
    return fallback
  }

  if (
    !Number.isInteger(value) ||
    value < 1 ||
    value > maximum
  ) {
    throw new RangeError(
      `limit must be an integer between 1 and ${maximum}.`
    )
  }

  return value
}

export function normalizeD1BookingRecord(
  row: Record<string, unknown>
): D1BookingRecord {
  return {
    id:
      requiredText(
        row.id,
        "id"
      ),

    bookingCode:
      requiredText(
        row.bookingCode,
        "bookingCode"
      ),

    bookingStatus:
      bookingStatusValue(
        row.bookingStatus
      ),

    paymentStatus:
      paymentStatusValue(
        row.paymentStatus
      ),

    seatHoldExpiresAt:
      nullableText(
        row.seatHoldExpiresAt,
        "seatHoldExpiresAt"
      ),

    paymentVerificationAllowed:
      booleanValue(
        row.paymentVerificationAllowed,
        "paymentVerificationAllowed"
      ),

    paymentReviewRequired:
      booleanValue(
        row.paymentReviewRequired,
        "paymentReviewRequired"
      ),

    paymentReviewReason:
      nullableText(
        row.paymentReviewReason,
        "paymentReviewReason"
      ),

    paymentReviewAt:
      nullableText(
        row.paymentReviewAt,
        "paymentReviewAt"
      ),

    termsAcceptedAt:
      nullableText(
        row.termsAcceptedAt,
        "termsAcceptedAt"
      ),

    refundPolicyAcceptedAt:
      nullableText(
        row.refundPolicyAcceptedAt,
        "refundPolicyAcceptedAt"
      ),

    termsVersion:
      nullableText(
        row.termsVersion,
        "termsVersion"
      ),

    refundPolicyVersion:
      nullableText(
        row.refundPolicyVersion,
        "refundPolicyVersion"
      ),

    tripType:
      tripTypeValue(
        row.tripType
      ),

    departureDate:
      requiredText(
        row.departureDate,
        "departureDate"
      ),

    returnDate:
      nullableText(
        row.returnDate,
        "returnDate"
      ),

    passengerCount:
      integerValue(
        row.passengerCount,
        "passengerCount",
        1
      ),

    totalPrice:
      integerValue(
        row.totalPrice,
        "totalPrice",
        0
      ),

    customerFullName:
      requiredText(
        row.customerFullName,
        "customerFullName"
      ),

    customerEmail:
      requiredText(
        row.customerEmail,
        "customerEmail"
      ),

    customerWhatsapp:
      requiredText(
        row.customerWhatsapp,
        "customerWhatsapp"
      ),

    customerCountry:
      requiredText(
        row.customerCountry,
        "customerCountry"
      ),

    passengersJson:
      requiredText(
        row.passengersJson,
        "passengersJson"
      ),

    tripId:
      requiredText(
        row.tripId,
        "tripId"
      ),

    tripInventoryId:
      requiredText(
        row.tripInventoryId,
        "tripInventoryId"
      ),

    returnTripInventoryId:
      nullableText(
        row.returnTripInventoryId,
        "returnTripInventoryId"
      ),

    inventoryCode:
      requiredText(
        row.inventoryCode,
        "inventoryCode"
      ),

    scheduleId:
      requiredText(
        row.scheduleId,
        "scheduleId"
      ),

    operatorId:
      requiredText(
        row.operatorId,
        "operatorId"
      ),

    vesselId:
      requiredText(
        row.vesselId,
        "vesselId"
      ),

    routeId:
      requiredText(
        row.routeId,
        "routeId"
      ),

    operatorName:
      requiredText(
        row.operatorName,
        "operatorName"
      ),

    vesselName:
      requiredText(
        row.vesselName,
        "vesselName"
      ),

    routeCode:
      requiredText(
        row.routeCode,
        "routeCode"
      ),

    fromPort:
      requiredText(
        row.fromPort,
        "fromPort"
      ),

    toPort:
      requiredText(
        row.toPort,
        "toPort"
      ),

    departureTime:
      requiredText(
        row.departureTime,
        "departureTime"
      ),

    arrivalTime:
      requiredText(
        row.arrivalTime,
        "arrivalTime"
      ),

    arrivalDayOffset:
      integerValue(
        row.arrivalDayOffset,
        "arrivalDayOffset",
        0
      ),

    duration:
      requiredText(
        row.duration,
        "duration"
      ),

    pricePerPassenger:
      integerValue(
        row.pricePerPassenger,
        "pricePerPassenger",
        0
      ),

    currency:
      requiredText(
        row.currency,
        "currency"
      ),

    checkInLocation:
      requiredText(
        row.checkInLocation,
        "checkInLocation"
      ),

    returnTripJson:
      nullableText(
        row.returnTripJson,
        "returnTripJson"
      ),

    notes:
      nullableText(
        row.notes,
        "notes"
      ),

    createdAt:
      requiredText(
        row.createdAt,
        "createdAt"
      ),

    updatedAt:
      requiredText(
        row.updatedAt,
        "updatedAt"
      ),
  }
}

async function firstBooking(
  sql: string,
  bindings: unknown[]
): Promise<D1BookingRecord | null> {
  try {
    const db =
      getD1()

    const row =
      await db
        .prepare(sql)
        .bind(...bindings)
        .first<
          Record<string, unknown>
        >()

    if (!row) {
      return null
    }

    return normalizeD1BookingRecord(
      row
    )
  } catch (error) {
    if (
      error instanceof
      D1BookingReadError
    ) {
      throw error
    }

    throw new D1BookingReadError(
      "DATABASE",
      "D1 booking read failed.",
      {
        cause: error,
      }
    )
  }
}

async function listBookings(
  sql: string,
  bindings: unknown[]
): Promise<D1BookingRecord[]> {
  try {
    const db =
      getD1()

    const result =
      await db
        .prepare(sql)
        .bind(...bindings)
        .all<
          Record<string, unknown>
        >()

    return result.results.map(
      normalizeD1BookingRecord
    )
  } catch (error) {
    if (
      error instanceof
      D1BookingReadError
    ) {
      throw error
    }

    throw new D1BookingReadError(
      "DATABASE",
      "D1 booking list read failed.",
      {
        cause: error,
      }
    )
  }
}

export async function getD1BookingById(
  id: string
): Promise<D1BookingRecord | null> {
  const normalizedId =
    id.trim()

  if (!normalizedId) {
    return null
  }

  return firstBooking(
    `
      SELECT
        ${BOOKING_SELECT_COLUMNS}
      FROM bookings
      WHERE id = ?
      LIMIT 1
    `,
    [
      normalizedId,
    ]
  )
}

export async function findD1BookingByCode(
  bookingCode: string
): Promise<D1BookingRecord | null> {
  const normalizedCode =
    bookingCode
      .trim()
      .toUpperCase()

  if (!normalizedCode) {
    return null
  }

  return firstBooking(
    `
      SELECT
        ${BOOKING_SELECT_COLUMNS}
      FROM bookings
      WHERE bookingCode = ?
      LIMIT 1
    `,
    [
      normalizedCode,
    ]
  )
}

export async function findD1BookingByCodeAndEmail(
  bookingCode: string,
  customerEmail: string
): Promise<D1BookingRecord | null> {
  const normalizedCode =
    bookingCode
      .trim()
      .toUpperCase()

  const normalizedEmail =
    customerEmail
      .trim()
      .toLowerCase()

  if (
    !normalizedCode ||
    !normalizedEmail
  ) {
    return null
  }

  return firstBooking(
    `
      SELECT
        ${BOOKING_SELECT_COLUMNS}
      FROM bookings
      WHERE bookingCode = ?
        AND lower(customerEmail) = ?
      LIMIT 1
    `,
    [
      normalizedCode,
      normalizedEmail,
    ]
  )
}

export async function listD1BookingsForDashboard(
  options:
    D1BookingListOptions = {}
): Promise<D1BookingRecord[]> {
  const limit =
    normalizeLimit(
      options.limit,
      200,
      500
    )

  return listBookings(
    `
      SELECT
        ${BOOKING_SELECT_COLUMNS}
      FROM bookings
      ORDER BY
        createdAt DESC,
        id DESC
      LIMIT ?
    `,
    [
      limit,
    ]
  )
}

export async function listD1BookingsByInventory(
  inventoryId: string,
  options:
    D1BookingListOptions = {}
): Promise<D1InventoryLinkedBooking[]> {
  const normalizedInventoryId =
    inventoryId.trim()

  if (!normalizedInventoryId) {
    return []
  }

  const limit =
    normalizeLimit(
      options.limit,
      500,
      500
    )

  const bookings =
    await listBookings(
      `
        SELECT
          ${BOOKING_SELECT_COLUMNS}
        FROM bookings
        WHERE tripInventoryId = ?
           OR returnTripInventoryId = ?
        ORDER BY
          createdAt ASC,
          id ASC
        LIMIT ?
      `,
      [
        normalizedInventoryId,
        normalizedInventoryId,
        limit,
      ]
    )

  return bookings.map(
    (booking) => ({
      booking,

      journeyLeg:
        booking.tripInventoryId ===
        normalizedInventoryId
          ? "outbound"
          : "return",
    })
  )
}

export async function listD1ExpiredPendingBookings(
  options:
    D1ExpiredPendingBookingListOptions
): Promise<D1BookingRecord[]> {
  const cutoff =
    options.cutoff.trim()

  if (!cutoff) {
    throw new RangeError(
      "cutoff is required."
    )
  }

  const limit =
    normalizeLimit(
      options.limit,
      100,
      500
    )

  return listBookings(
    `
      SELECT
        ${BOOKING_SELECT_COLUMNS}
      FROM bookings
      WHERE bookingStatus = 'Pending'
        AND paymentStatus = 'Pending'
        AND seatHoldExpiresAt IS NOT NULL
        AND seatHoldExpiresAt <= ?
      ORDER BY
        seatHoldExpiresAt ASC,
        id ASC
      LIMIT ?
    `,
    [
      cutoff,
      limit,
    ]
  )
}
