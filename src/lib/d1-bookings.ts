import { getD1 } from "@/lib/d1-server";
import {
  PaymentReviewResolutionError,
  resolvePaymentReview,
} from "@/lib/payment-review-resolution";

export type D1BookingStatus =
  | "Pending"
  | "Confirmed"
  | "Completed"
  | "Cancelled";

export type D1PaymentStatus =
  | "Demo"
  | "Pending"
  | "Paid"
  | "Refunded";

export type D1InventorySalesStatus =
  | "OPEN"
  | "SOLD_OUT"
  | "CLOSED"
  | "CANCELLED";

export type D1BookingWriteErrorKind =
  | "BUSINESS_ASSERTION"
  | "BUSINESS_RULE"
  | "SEAT_CONSTRAINT"
  | "UNIQUE_CONSTRAINT"
  | "FOREIGN_KEY_CONSTRAINT"
  | "DATABASE";

export class D1BookingDalError extends Error {
  readonly kind: D1BookingWriteErrorKind;

  constructor(
    kind: D1BookingWriteErrorKind,
    message: string,
  ) {
    super(message);

    this.name = "D1BookingDalError";
    this.kind = kind;
  }
}

export interface D1BookingMutationSnapshot {
  id: string;
  bookingCode: string;
  bookingStatus: D1BookingStatus;
  paymentStatus: D1PaymentStatus;
  paymentReviewRequired: boolean;
  tripType: D1BookingTripType;
  passengerCount: number;
  tripInventoryId: string;
  returnTripInventoryId: string | null;
  seatHoldExpiresAt: string | null;
}

export interface D1InventoryMutationSnapshot {
  id: string;
  scheduleId: string;
  operatorId: string;
  vesselId: string;
  routeId: string;
  seatCapacity: number;
  bookedSeats: number;
  heldSeats: number;
  salesStatus: D1InventorySalesStatus;
  isActive: number;
}

export interface D1InventoryAssertionInput {
  token: string;
  inventoryId: string;
  passengerCount: number;
}

export interface D1BookingStateAssertionInput {
  token: string;
  bookingId: string;
  bookingStatus: D1BookingStatus;
  paymentStatus: D1PaymentStatus;
  paymentReviewRequired: boolean;
  tripType: D1BookingTripType;
  passengerCount: number;
  tripInventoryId: string;
  returnTripInventoryId: string | null;
}

function cleanRequiredText(
  value: string,
  label: string,
): string {
  const cleaned = value.trim();

  if (!cleaned) {
    throw new D1BookingDalError(
      "DATABASE",
      `${label} is required.`,
    );
  }

  return cleaned;
}

function positiveInteger(
  value: number,
  label: string,
): number {
  if (
    !Number.isInteger(value) ||
    value <= 0
  ) {
    throw new D1BookingDalError(
      "DATABASE",
      `${label} must be a positive integer.`,
    );
  }

  return value;
}

function asInteger(
  value: unknown,
  label: string,
): number {
  const numeric = Number(value);

  if (!Number.isInteger(numeric)) {
    throw new D1BookingDalError(
      "DATABASE",
      `${label} must be an integer.`,
    );
  }

  return numeric;
}

function nullableText(
  value: unknown,
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const cleaned =
    String(value).trim();

  return cleaned || null;
}

export function makeD1BookingAssertionToken(
  prefix: string,
): string {
  const cleanPrefix =
    cleanRequiredText(
      prefix,
      "Assertion token prefix",
    );

  return `${cleanPrefix}:${crypto.randomUUID()}`;
}

export function classifyD1BookingWriteError(
  error: unknown,
): D1BookingWriteErrorKind {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  if (
    message.includes(
      "CHECK constraint failed: ok = 1",
    )
  ) {
    return "BUSINESS_ASSERTION";
  }

  if (
    message.includes(
      "CHECK constraint failed: bookedSeats >= 0",
    ) ||
    message.includes(
      "CHECK constraint failed: heldSeats >= 0",
    ) ||
    message.includes(
      "CHECK constraint failed: bookedSeats + heldSeats",
    )
  ) {
    return "SEAT_CONSTRAINT";
  }

  if (
    message.includes(
      "UNIQUE constraint failed",
    )
  ) {
    return "UNIQUE_CONSTRAINT";
  }

  if (
    message.includes(
      "FOREIGN KEY constraint failed",
    )
  ) {
    return "FOREIGN_KEY_CONSTRAINT";
  }

  return "DATABASE";
}

export function toD1BookingDalError(
  error: unknown,
): D1BookingDalError {
  if (
    error instanceof D1BookingDalError
  ) {
    return error;
  }

  return new D1BookingDalError(
    classifyD1BookingWriteError(
      error,
    ),
    error instanceof Error
      ? error.message
      : String(error),
  );
}

export async function getD1BookingMutationSnapshot(
  bookingId: string,
): Promise<D1BookingMutationSnapshot | null> {
  const id =
    cleanRequiredText(
      bookingId,
      "Booking ID",
    );

  const row =
    await getD1()
      .prepare(`
        SELECT
          id,
          bookingCode,
          bookingStatus,
          paymentStatus,
          paymentReviewRequired,
          tripType,
          passengerCount,
          tripInventoryId,
          returnTripInventoryId,
          seatHoldExpiresAt
        FROM bookings
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>();

  if (!row) {
    return null;
  }

  return {
    id:
      cleanRequiredText(
        String(row.id ?? ""),
        "Booking ID",
      ),

    bookingCode:
      cleanRequiredText(
        String(row.bookingCode ?? ""),
        "Booking code",
      ),

    bookingStatus:
      String(
        row.bookingStatus ?? "",
      ) as D1BookingStatus,

    paymentStatus:
      String(
        row.paymentStatus ?? "",
      ) as D1PaymentStatus,

    paymentReviewRequired:
      (() => {
        const value =
          asInteger(
            row.paymentReviewRequired,
            "Payment review required",
          );

        if (
          value !== 0 &&
          value !== 1
        ) {
          throw new D1BookingDalError(
            "DATABASE",
            "Payment review required must be 0 or 1.",
          );
        }

        return value === 1;
      })(),

    tripType:
      String(
        row.tripType ?? "",
      ) as D1BookingTripType,

    /*
     * Identity-only here.
     * Current Appwrite lifecycle requires
     * passengerCount >= 1 only when
     * seats actually move.
     */
    passengerCount:
      asInteger(
        row.passengerCount,
        "Passenger count",
      ),

    tripInventoryId:
      cleanRequiredText(
        String(
          row.tripInventoryId ?? "",
        ),
        "Trip inventory ID",
      ),

    returnTripInventoryId:
      nullableText(
        row.returnTripInventoryId,
      ),

    seatHoldExpiresAt:
      nullableText(
        row.seatHoldExpiresAt,
      ),
  };
}

export async function getD1InventoryMutationSnapshot(
  inventoryId: string,
): Promise<D1InventoryMutationSnapshot | null> {
  const id =
    cleanRequiredText(
      inventoryId,
      "Trip inventory ID",
    );

  const row =
    await getD1()
      .prepare(`
        SELECT
          id,
          scheduleId,
          operatorId,
          vesselId,
          routeId,
          seatCapacity,
          bookedSeats,
          heldSeats,
          salesStatus,
          isActive
        FROM trip_inventory
        WHERE id = ?
        LIMIT 1
      `)
      .bind(id)
      .first<Record<string, unknown>>();

  if (!row) {
    return null;
  }

  return {
    id:
      cleanRequiredText(
        String(row.id ?? ""),
        "Trip inventory ID",
      ),

    scheduleId:
      cleanRequiredText(
        String(row.scheduleId ?? ""),
        "Schedule ID",
      ),

    operatorId:
      cleanRequiredText(
        String(row.operatorId ?? ""),
        "Operator ID",
      ),

    vesselId:
      cleanRequiredText(
        String(row.vesselId ?? ""),
        "Vessel ID",
      ),

    routeId:
      cleanRequiredText(
        String(row.routeId ?? ""),
        "Route ID",
      ),

    seatCapacity:
      asInteger(
        row.seatCapacity,
        "Seat capacity",
      ),

    bookedSeats:
      asInteger(
        row.bookedSeats,
        "Booked seats",
      ),

    heldSeats:
      asInteger(
        row.heldSeats,
        "Held seats",
      ),

    salesStatus:
      String(
        row.salesStatus ?? "",
      ) as D1InventorySalesStatus,

    isActive:
      asInteger(
        row.isActive,
        "Inventory active flag",
      ),
  };
}

export function buildD1InventoryBookingAssertion(
  db: D1Database,
  input: D1InventoryAssertionInput,
): D1PreparedStatement {
  const token =
    cleanRequiredText(
      input.token,
      "Assertion token",
    );

  const inventoryId =
    cleanRequiredText(
      input.inventoryId,
      "Trip inventory ID",
    );

  const passengerCount =
    positiveInteger(
      input.passengerCount,
      "Passenger count",
    );

  return db
    .prepare(`
      INSERT INTO d1_transaction_assertions (
        token,
        ok
      )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM trip_inventory AS i

            INNER JOIN trip_schedules AS s
              ON s.id = i.scheduleId

            INNER JOIN operators AS o
              ON o.id = i.operatorId

            INNER JOIN vessels AS v
              ON v.id = i.vesselId

            INNER JOIN routes AS r
              ON r.id = i.routeId

            WHERE i.id = ?

              AND i.isActive = 1
              AND i.salesStatus = 'OPEN'

              AND s.isActive = 1
              AND o.isActive = 1
              AND v.isActive = 1
              AND r.isActive = 1

              AND s.operatorId = i.operatorId
              AND s.vesselId = i.vesselId
              AND s.routeId = i.routeId

              AND v.operatorId = i.operatorId

              AND (
                i.seatCapacity
                - i.bookedSeats
                - i.heldSeats
              ) >= ?
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      token,
      inventoryId,
      passengerCount,
    );
}

export function buildD1BookingStateAssertion(
  db: D1Database,
  input: D1BookingStateAssertionInput,
): D1PreparedStatement {
  const token =
    cleanRequiredText(
      input.token,
      "Assertion token",
    );

  const bookingId =
    cleanRequiredText(
      input.bookingId,
      "Booking ID",
    );

  const tripInventoryId =
    cleanRequiredText(
      input.tripInventoryId,
      "Trip inventory ID",
    );

  const passengerCount =
    asInteger(
      input.passengerCount,
      "Passenger count",
    );

  const returnTripInventoryId =
    nullableText(
      input.returnTripInventoryId,
    );

  return db
    .prepare(`
      INSERT INTO d1_transaction_assertions (
        token,
        ok
      )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM bookings AS b
            WHERE b.id = ?
              AND b.bookingStatus = ?
              AND b.paymentStatus = ?
              AND b.paymentReviewRequired = ?
              AND b.tripType = ?
              AND b.passengerCount = ?
              AND b.tripInventoryId = ?

              AND (
                (
                  ? IS NULL
                  AND b.returnTripInventoryId IS NULL
                )
                OR b.returnTripInventoryId = ?
              )
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      token,
      bookingId,
      input.bookingStatus,
      input.paymentStatus,
      input.paymentReviewRequired
        ? 1
        : 0,
      input.tripType,
      passengerCount,
      tripInventoryId,
      returnTripInventoryId,
      returnTripInventoryId,
    );
}

export function buildD1DeleteAssertion(
  db: D1Database,
  token: string,
): D1PreparedStatement {
  return db
    .prepare(`
      DELETE FROM d1_transaction_assertions
      WHERE token = ?
    `)
    .bind(
      cleanRequiredText(
        token,
        "Assertion token",
      ),
    );
}

export type D1BookingTripType =
  | "one-way"
  | "round-trip";

export interface D1PendingBookingCreateInput {
  id: string;
  bookingCode: string;
  seatHoldExpiresAt: string;
  paymentVerificationAllowed: boolean;

  tripType: D1BookingTripType;
  departureDate: string;
  returnDate: string | null;

  passengerCount: number;
  totalPrice: number;

  customerFullName: string;
  customerEmail: string;
  customerWhatsapp: string;
  customerCountry: string;

  passengersJson: string;

  tripId: string;
  tripInventoryId: string;
  returnTripInventoryId: string | null;

  inventoryCode: string;
  scheduleId: string;
  operatorId: string;
  vesselId: string;
  routeId: string;

  operatorName: string;
  vesselName: string;
  routeCode: string;

  fromPort: string;
  toPort: string;

  departureTime: string;
  arrivalTime: string;
  arrivalDayOffset: number;
  duration: string;

  pricePerPassenger: number;
  currency: string;
  checkInLocation: string;

  returnTripJson: string | null;
  notes: string | null;
}

function nonNegativeInteger(
  value: number,
  label: string,
): number {
  if (
    !Number.isSafeInteger(value) ||
    value < 0
  ) {
    throw new D1BookingDalError(
      "DATABASE",
      `${label} must be a non-negative safe integer.`,
    );
  }

  return value;
}

function normalizeNullableInputText(
  value: string | null,
): string | null {
  return nullableText(value);
}

function validateD1PendingBookingCreateInput(
  input: D1PendingBookingCreateInput,
): D1PendingBookingCreateInput {
  const id =
    cleanRequiredText(
      input.id,
      "Booking ID",
    );

  const bookingCode =
    cleanRequiredText(
      input.bookingCode,
      "Booking code",
    );

  const seatHoldExpiresAt =
    cleanRequiredText(
      input.seatHoldExpiresAt,
      "Seat hold expiry",
    );

  const departureDate =
    cleanRequiredText(
      input.departureDate,
      "Departure date",
    );

  const passengerCount =
    positiveInteger(
      input.passengerCount,
      "Passenger count",
    );

  const totalPrice =
    nonNegativeInteger(
      input.totalPrice,
      "Total price",
    );

  const tripId =
    cleanRequiredText(
      input.tripId,
      "Trip ID",
    );

  const tripInventoryId =
    cleanRequiredText(
      input.tripInventoryId,
      "Trip inventory ID",
    );

  if (
    tripId !== tripInventoryId
  ) {
    throw new D1BookingDalError(
      "DATABASE",
      "Trip ID must match the outbound trip inventory ID.",
    );
  }

  const returnTripInventoryId =
    normalizeNullableInputText(
      input.returnTripInventoryId,
    );

  const returnDate =
    normalizeNullableInputText(
      input.returnDate,
    );

  const returnTripJson =
    normalizeNullableInputText(
      input.returnTripJson,
    );

  if (
    input.tripType === "round-trip"
  ) {
    if (
      !returnTripInventoryId ||
      !returnDate ||
      !returnTripJson
    ) {
      throw new D1BookingDalError(
        "DATABASE",
        "Round-trip booking data is incomplete.",
      );
    }

    if (
      returnTripInventoryId ===
      tripInventoryId
    ) {
      throw new D1BookingDalError(
        "DATABASE",
        "Return trip inventory must differ from outbound inventory.",
      );
    }
  } else if (
    input.tripType === "one-way"
  ) {
    if (
      returnTripInventoryId ||
      returnDate ||
      returnTripJson
    ) {
      throw new D1BookingDalError(
        "DATABASE",
        "One-way booking must not contain return-trip data.",
      );
    }
  } else {
    throw new D1BookingDalError(
      "DATABASE",
      "Unsupported trip type.",
    );
  }

  return {
    ...input,

    id,
    bookingCode,
    seatHoldExpiresAt,

    departureDate,
    passengerCount,
    totalPrice,

    customerFullName:
      cleanRequiredText(
        input.customerFullName,
        "Customer full name",
      ),

    customerEmail:
      cleanRequiredText(
        input.customerEmail,
        "Customer email",
      ),

    customerWhatsapp:
      cleanRequiredText(
        input.customerWhatsapp,
        "Customer WhatsApp",
      ),

    customerCountry:
      cleanRequiredText(
        input.customerCountry,
        "Customer country",
      ),

    passengersJson:
      cleanRequiredText(
        input.passengersJson,
        "Passengers JSON",
      ),

    tripId,
    tripInventoryId,
    returnTripInventoryId,

    inventoryCode:
      cleanRequiredText(
        input.inventoryCode,
        "Inventory code",
      ),

    scheduleId:
      cleanRequiredText(
        input.scheduleId,
        "Schedule ID",
      ),

    operatorId:
      cleanRequiredText(
        input.operatorId,
        "Operator ID",
      ),

    vesselId:
      cleanRequiredText(
        input.vesselId,
        "Vessel ID",
      ),

    routeId:
      cleanRequiredText(
        input.routeId,
        "Route ID",
      ),

    operatorName:
      cleanRequiredText(
        input.operatorName,
        "Operator name",
      ),

    vesselName:
      cleanRequiredText(
        input.vesselName,
        "Vessel name",
      ),

    routeCode:
      cleanRequiredText(
        input.routeCode,
        "Route code",
      ),

    fromPort:
      cleanRequiredText(
        input.fromPort,
        "From port",
      ),

    toPort:
      cleanRequiredText(
        input.toPort,
        "To port",
      ),

    departureTime:
      cleanRequiredText(
        input.departureTime,
        "Departure time",
      ),

    arrivalTime:
      cleanRequiredText(
        input.arrivalTime,
        "Arrival time",
      ),

    arrivalDayOffset:
      nonNegativeInteger(
        input.arrivalDayOffset,
        "Arrival day offset",
      ),

    duration:
      cleanRequiredText(
        input.duration,
        "Duration",
      ),

    pricePerPassenger:
      nonNegativeInteger(
        input.pricePerPassenger,
        "Price per passenger",
      ),

    currency:
      cleanRequiredText(
        input.currency,
        "Currency",
      ),

    checkInLocation:
      cleanRequiredText(
        input.checkInLocation,
        "Check-in location",
      ),

    returnDate,
    returnTripJson,

    notes:
      normalizeNullableInputText(
        input.notes,
      ),
  };
}

export function buildD1PendingBookingInsert(
  db: D1Database,
  input: D1PendingBookingCreateInput,
): D1PreparedStatement {
  const booking =
    validateD1PendingBookingCreateInput(
      input,
    );

  return db
    .prepare(`
      INSERT INTO bookings (
        id,
        bookingCode,
        bookingStatus,
        paymentStatus,
        seatHoldExpiresAt,
        paymentVerificationAllowed,

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
        notes
      )
      VALUES (
        ?,
        ?,
        'Pending',
        'Pending',
        ?,
        ?,

        ?,
        ?,
        ?,

        ?,
        ?,

        ?,
        ?,
        ?,
        ?,

        ?,

        ?,
        ?,
        ?,

        ?,
        ?,
        ?,
        ?,
        ?,

        ?,
        ?,
        ?,

        ?,
        ?,

        ?,
        ?,
        ?,
        ?,

        ?,
        ?,
        ?,

        ?,
        ?
      )
    `)
    .bind(
      booking.id,
      booking.bookingCode,
      booking.seatHoldExpiresAt,

      booking.paymentVerificationAllowed
        ? 1
        : 0,

      booking.tripType,
      booking.departureDate,
      booking.returnDate,

      booking.passengerCount,
      booking.totalPrice,

      booking.customerFullName,
      booking.customerEmail,
      booking.customerWhatsapp,
      booking.customerCountry,

      booking.passengersJson,

      booking.tripId,
      booking.tripInventoryId,
      booking.returnTripInventoryId,

      booking.inventoryCode,
      booking.scheduleId,
      booking.operatorId,
      booking.vesselId,
      booking.routeId,

      booking.operatorName,
      booking.vesselName,
      booking.routeCode,

      booking.fromPort,
      booking.toPort,

      booking.departureTime,
      booking.arrivalTime,
      booking.arrivalDayOffset,
      booking.duration,

      booking.pricePerPassenger,
      booking.currency,
      booking.checkInLocation,

      booking.returnTripJson,
      booking.notes,
    );
}

export function buildD1HoldInventorySeats(
  db: D1Database,
  inventoryId: string,
  passengerCount: number,
): D1PreparedStatement {
  const id =
    cleanRequiredText(
      inventoryId,
      "Trip inventory ID",
    );

  const seats =
    positiveInteger(
      passengerCount,
      "Passenger count",
    );

  return db
    .prepare(`
      UPDATE trip_inventory
      SET
        heldSeats =
          heldSeats + ?,

        salesStatus =
          CASE
            WHEN
              salesStatus = 'OPEN'
              AND (
                seatCapacity
                - bookedSeats
                - heldSeats
                - ?
              ) <= 0
            THEN 'SOLD_OUT'
            ELSE salesStatus
          END

      WHERE id = ?
        AND isActive = 1
        AND salesStatus = 'OPEN'
    `)
    .bind(
      seats,
      seats,
      id,
    );
}

export async function createD1PendingBookingWithSeatHold(
  input: D1PendingBookingCreateInput,
): Promise<void> {
  const booking =
    validateD1PendingBookingCreateInput(
      input,
    );

  const db = getD1();

  const outboundAssertionToken =
    makeD1BookingAssertionToken(
      "booking-create-outbound",
    );

  const returnAssertionToken =
    booking.returnTripInventoryId
      ? makeD1BookingAssertionToken(
          "booking-create-return",
        )
      : null;

  const statements: D1PreparedStatement[] = [
    buildD1InventoryBookingAssertion(
      db,
      {
        token:
          outboundAssertionToken,

        inventoryId:
          booking.tripInventoryId,

        passengerCount:
          booking.passengerCount,
      },
    ),
  ];

  if (
    booking.returnTripInventoryId &&
    returnAssertionToken
  ) {
    statements.push(
      buildD1InventoryBookingAssertion(
        db,
        {
          token:
            returnAssertionToken,

          inventoryId:
            booking.returnTripInventoryId,

          passengerCount:
            booking.passengerCount,
        },
      ),
    );
  }

  statements.push(
    buildD1PendingBookingInsert(
      db,
      booking,
    ),

    buildD1HoldInventorySeats(
      db,
      booking.tripInventoryId,
      booking.passengerCount,
    ),
  );

  if (
    booking.returnTripInventoryId
  ) {
    statements.push(
      buildD1HoldInventorySeats(
        db,
        booking.returnTripInventoryId,
        booking.passengerCount,
      ),
    );
  }

  statements.push(
    buildD1DeleteAssertion(
      db,
      outboundAssertionToken,
    ),
  );

  if (returnAssertionToken) {
    statements.push(
      buildD1DeleteAssertion(
        db,
        returnAssertionToken,
      ),
    );
  }

  try {
    await db.batch(
      statements,
    );
  } catch (error) {
    throw toD1BookingDalError(
      error,
    );
  }
}

export type D1BookingSeatPosition =
  | "held"
  | "booked"
  | "released";

export type D1InventorySeatAction =
  | "none"
  | "release-held"
  | "release-booked"
  | "add-held"
  | "add-booked"
  | "held-to-booked"
  | "booked-to-held";

export interface D1BookingLifecycleUpdateInput {
  bookingId: string;

  currentBookingStatus:
    D1BookingStatus;

  currentPaymentStatus:
    D1PaymentStatus;

  currentPaymentReviewRequired:
    boolean;

  tripType:
    D1BookingTripType;

  passengerCount:
    number;

  tripInventoryId:
    string;

  returnTripInventoryId:
    string | null;

  nextBookingStatus:
    D1BookingStatus;

  nextPaymentStatus:
    D1PaymentStatus;

  resolvePaymentReview:
    boolean;
}

export interface D1BookingLifecycleUpdateResult {
  seatAction:
    D1InventorySeatAction;

  paymentReviewResolved:
    boolean;
}

export function isD1AllowedBookingTransition(
  currentStatus: D1BookingStatus,
  nextStatus: D1BookingStatus,
): boolean {
  const transitions: Record<
    D1BookingStatus,
    D1BookingStatus[]
  > = {
    Pending: [
      "Pending",
      "Confirmed",
      "Cancelled",
    ],

    Confirmed: [
      "Pending",
      "Confirmed",
      "Completed",
      "Cancelled",
    ],

    Completed: [
      "Completed",
    ],

    Cancelled: [
      "Cancelled",
      "Pending",
      "Confirmed",
    ],
  };

  return transitions[
    currentStatus
  ].includes(
    nextStatus,
  );
}

export function isD1AllowedStatusPair(
  bookingStatus: D1BookingStatus,
  paymentStatus: D1PaymentStatus,
): boolean {
  if (
    bookingStatus === "Pending"
  ) {
    return (
      paymentStatus === "Pending"
    );
  }

  if (
    bookingStatus === "Confirmed" ||
    bookingStatus === "Completed"
  ) {
    return (
      paymentStatus === "Demo" ||
      paymentStatus === "Paid" ||
      paymentStatus === "Refunded"
    );
  }

  /*
   * Cancelled accepts every valid
   * PaymentStatus in the authoritative
   * Appwrite route.
   */
  return (
    bookingStatus === "Cancelled"
  );
}

export function getD1BookingSeatPosition(
  bookingStatus: D1BookingStatus,
): D1BookingSeatPosition {
  if (
    bookingStatus === "Pending"
  ) {
    return "held";
  }

  if (
    bookingStatus === "Cancelled"
  ) {
    return "released";
  }

  return "booked";
}

export function determineD1InventorySeatAction({
  currentStatus,
  nextStatus,
}: {
  currentStatus:
    D1BookingStatus;

  nextStatus:
    D1BookingStatus;
}): D1InventorySeatAction {
  const currentPosition =
    getD1BookingSeatPosition(
      currentStatus,
    );

  const nextPosition =
    getD1BookingSeatPosition(
      nextStatus,
    );

  if (
    currentPosition ===
    nextPosition
  ) {
    return "none";
  }

  if (
    currentPosition === "held" &&
    nextPosition === "booked"
  ) {
    return "held-to-booked";
  }

  if (
    currentPosition === "held" &&
    nextPosition === "released"
  ) {
    return "release-held";
  }

  if (
    currentPosition === "booked" &&
    nextPosition === "held"
  ) {
    return "booked-to-held";
  }

  if (
    currentPosition === "booked" &&
    nextPosition === "released"
  ) {
    return "release-booked";
  }

  if (
    currentPosition === "released" &&
    nextPosition === "held"
  ) {
    return "add-held";
  }

  if (
    currentPosition === "released" &&
    nextPosition === "booked"
  ) {
    return "add-booked";
  }

  throw new D1BookingDalError(
    "BUSINESS_RULE",
    "Unsupported booking seat transition.",
  );
}

export function buildD1LifecycleInventoryAssertion(
  db: D1Database,
  {
    token,
    inventoryId,
    passengerCount,
    action,
  }: {
    token: string;

    inventoryId: string;

    passengerCount: number;

    action: Exclude<
      D1InventorySeatAction,
      "none"
    >;
  },
): D1PreparedStatement {
  const assertionToken =
    cleanRequiredText(
      token,
      "Assertion token",
    );

  const id =
    cleanRequiredText(
      inventoryId,
      "Trip inventory ID",
    );

  const seats =
    positiveInteger(
      passengerCount,
      "Passenger count",
    );

  let condition:
    string;

  if (
    action === "release-held" ||
    action === "held-to-booked"
  ) {
    condition =
      "i.heldSeats >= ?";
  } else if (
    action === "release-booked" ||
    action === "booked-to-held"
  ) {
    condition =
      "i.bookedSeats >= ?";
  } else {
    /*
     * add-held / add-booked create
     * a new reservation from a
     * released booking.
     *
     * Appwrite permits SOLD_OUT when
     * its counters expose free seats;
     * normalization below can reopen it.
     */
    condition = `
      i.isActive = 1

      AND i.salesStatus NOT IN (
        'CLOSED',
        'CANCELLED'
      )

      AND (
        i.seatCapacity
        - i.bookedSeats
        - i.heldSeats
      ) >= ?
    `;
  }

  return db
    .prepare(`
      INSERT INTO d1_transaction_assertions (
        token,
        ok
      )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM trip_inventory AS i
            WHERE i.id = ?
              AND ${condition}
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      assertionToken,
      id,
      seats,
    );
}

export function buildD1LifecycleSeatMutation(
  db: D1Database,
  inventoryId: string,
  passengerCount: number,
  action: Exclude<
    D1InventorySeatAction,
    "none"
  >,
): D1PreparedStatement {
  const id =
    cleanRequiredText(
      inventoryId,
      "Trip inventory ID",
    );

  const seats =
    positiveInteger(
      passengerCount,
      "Passenger count",
    );

  if (
    action === "release-held"
  ) {
    return db
      .prepare(`
        UPDATE trip_inventory
        SET heldSeats =
          heldSeats - ?
        WHERE id = ?
      `)
      .bind(
        seats,
        id,
      );
  }

  if (
    action === "release-booked"
  ) {
    return db
      .prepare(`
        UPDATE trip_inventory
        SET bookedSeats =
          bookedSeats - ?
        WHERE id = ?
      `)
      .bind(
        seats,
        id,
      );
  }

  if (
    action === "add-held"
  ) {
    return db
      .prepare(`
        UPDATE trip_inventory
        SET heldSeats =
          heldSeats + ?
        WHERE id = ?
      `)
      .bind(
        seats,
        id,
      );
  }

  if (
    action === "add-booked"
  ) {
    return db
      .prepare(`
        UPDATE trip_inventory
        SET bookedSeats =
          bookedSeats + ?
        WHERE id = ?
      `)
      .bind(
        seats,
        id,
      );
  }

  if (
    action === "held-to-booked"
  ) {
    return db
      .prepare(`
        UPDATE trip_inventory
        SET
          heldSeats =
            heldSeats - ?,

          bookedSeats =
            bookedSeats + ?
        WHERE id = ?
      `)
      .bind(
        seats,
        seats,
        id,
      );
  }

  /*
   * The only remaining action is
   * booked-to-held.
   */
  return db
    .prepare(`
      UPDATE trip_inventory
      SET
        bookedSeats =
          bookedSeats - ?,

        heldSeats =
          heldSeats + ?
      WHERE id = ?
    `)
    .bind(
      seats,
      seats,
      id,
    );
}

export function buildD1NormalizeLifecycleSalesStatus(
  db: D1Database,
  inventoryId: string,
): D1PreparedStatement {
  return db
    .prepare(`
      UPDATE trip_inventory
      SET salesStatus =
        CASE
          WHEN
            salesStatus = 'OPEN'
            AND (
              seatCapacity
              - bookedSeats
              - heldSeats
            ) <= 0
          THEN 'SOLD_OUT'

          WHEN
            salesStatus = 'SOLD_OUT'
            AND (
              seatCapacity
              - bookedSeats
              - heldSeats
            ) > 0
          THEN 'OPEN'

          ELSE salesStatus
        END
      WHERE id = ?
    `)
    .bind(
      cleanRequiredText(
        inventoryId,
        "Trip inventory ID",
      ),
    );
}

export function buildD1BookingLifecycleUpdate(
  db: D1Database,
  {
    bookingId,
    bookingStatus,
    paymentStatus,
    paymentReviewRequired,
  }: {
    bookingId: string;

    bookingStatus:
      D1BookingStatus;

    paymentStatus:
      D1PaymentStatus;

    paymentReviewRequired:
      boolean;
  },
): D1PreparedStatement {
  return db
    .prepare(`
      UPDATE bookings
      SET
        bookingStatus = ?,
        paymentStatus = ?,
        paymentReviewRequired = ?
      WHERE id = ?
    `)
    .bind(
      bookingStatus,
      paymentStatus,

      paymentReviewRequired
        ? 1
        : 0,

      cleanRequiredText(
        bookingId,
        "Booking ID",
      ),
    );
}

export async function updateD1BookingLifecycle(
  input: D1BookingLifecycleUpdateInput,
): Promise<D1BookingLifecycleUpdateResult> {
  const bookingId =
    cleanRequiredText(
      input.bookingId,
      "Booking ID",
    );

  const tripInventoryId =
    cleanRequiredText(
      input.tripInventoryId,
      "Trip inventory ID",
    );

  const returnTripInventoryId =
    nullableText(
      input.returnTripInventoryId,
    );

  if (
    !isD1AllowedBookingTransition(
      input.currentBookingStatus,
      input.nextBookingStatus,
    )
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      `Booking status cannot be changed from ${input.currentBookingStatus} to ${input.nextBookingStatus}.`,
    );
  }

  if (
    !isD1AllowedStatusPair(
      input.nextBookingStatus,
      input.nextPaymentStatus,
    )
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      "The selected booking and payment statuses are not compatible.",
    );
  }

  const seatAction =
    determineD1InventorySeatAction({
      currentStatus:
        input.currentBookingStatus,

      nextStatus:
        input.nextBookingStatus,
    });

  if (
    seatAction !== "none"
  ) {
    positiveInteger(
      input.passengerCount,
      "Passenger count",
    );

    if (
      input.tripType ===
        "round-trip" &&
      !returnTripInventoryId
    ) {
      throw new D1BookingDalError(
        "BUSINESS_RULE",
        "This round-trip booking does not contain a linked return inventory.",
      );
    }

    if (
      returnTripInventoryId &&
      returnTripInventoryId ===
        tripInventoryId
    ) {
      throw new D1BookingDalError(
        "BUSINESS_RULE",
        "Outbound and return inventory IDs cannot be identical.",
      );
    }
  }

  let paymentReviewResolution:
    ReturnType<
      typeof resolvePaymentReview
    >;

  try {
    paymentReviewResolution =
      resolvePaymentReview({
        reviewRequired:
          input.currentPaymentReviewRequired,

        resolveRequested:
          input.resolvePaymentReview,

        bookingStatus:
          input.nextBookingStatus,

        paymentStatus:
          input.nextPaymentStatus,
      });
  } catch (error) {
    if (
      error instanceof
      PaymentReviewResolutionError
    ) {
      throw new D1BookingDalError(
        "BUSINESS_RULE",
        error.message,
      );
    }

    throw error;
  }

  const nextPaymentReviewRequired =
    paymentReviewResolution
      .bookingUpdate
      ?.paymentReviewRequired ??
    input.currentPaymentReviewRequired;

  const db =
    getD1();

  const bookingAssertionToken =
    makeD1BookingAssertionToken(
      "booking-lifecycle-state",
    );

  const statements:
    D1PreparedStatement[] = [
      buildD1BookingStateAssertion(
        db,
        {
          token:
            bookingAssertionToken,

          bookingId,

          bookingStatus:
            input.currentBookingStatus,

          paymentStatus:
            input.currentPaymentStatus,

          paymentReviewRequired:
            input.currentPaymentReviewRequired,

          tripType:
            input.tripType,

          passengerCount:
            input.passengerCount,

          tripInventoryId,

          returnTripInventoryId,
        },
      ),
    ];

  let outboundAssertionToken:
    string | null =
    null;

  let returnAssertionToken:
    string | null =
    null;

  if (
    seatAction !== "none"
  ) {
    outboundAssertionToken =
      makeD1BookingAssertionToken(
        "booking-lifecycle-outbound",
      );

    statements.push(
      buildD1LifecycleInventoryAssertion(
        db,
        {
          token:
            outboundAssertionToken,

          inventoryId:
            tripInventoryId,

          passengerCount:
            input.passengerCount,

          action:
            seatAction,
        },
      ),
    );

    if (
      returnTripInventoryId
    ) {
      returnAssertionToken =
        makeD1BookingAssertionToken(
          "booking-lifecycle-return",
        );

      statements.push(
        buildD1LifecycleInventoryAssertion(
          db,
          {
            token:
              returnAssertionToken,

            inventoryId:
              returnTripInventoryId,

            passengerCount:
              input.passengerCount,

            action:
              seatAction,
          },
        ),
      );
    }

    /*
     * Every assertion is queued before
     * the first mutation.
     */
    statements.push(
      buildD1LifecycleSeatMutation(
        db,
        tripInventoryId,
        input.passengerCount,
        seatAction,
      ),

      buildD1NormalizeLifecycleSalesStatus(
        db,
        tripInventoryId,
      ),
    );

    if (
      returnTripInventoryId
    ) {
      statements.push(
        buildD1LifecycleSeatMutation(
          db,
          returnTripInventoryId,
          input.passengerCount,
          seatAction,
        ),

        buildD1NormalizeLifecycleSalesStatus(
          db,
          returnTripInventoryId,
        ),
      );
    }
  }

  statements.push(
    buildD1BookingLifecycleUpdate(
      db,
      {
        bookingId,

        bookingStatus:
          input.nextBookingStatus,

        paymentStatus:
          input.nextPaymentStatus,

        paymentReviewRequired:
          nextPaymentReviewRequired,
      },
    ),

    buildD1DeleteAssertion(
      db,
      bookingAssertionToken,
    ),
  );

  if (
    outboundAssertionToken
  ) {
    statements.push(
      buildD1DeleteAssertion(
        db,
        outboundAssertionToken,
      ),
    );
  }

  if (
    returnAssertionToken
  ) {
    statements.push(
      buildD1DeleteAssertion(
        db,
        returnAssertionToken,
      ),
    );
  }

  try {
    await db.batch(
      statements,
    );
  } catch (error) {
    throw toD1BookingDalError(
      error,
    );
  }

  return {
    seatAction,

    paymentReviewResolved:
      paymentReviewResolution
        .resolved,
  };
}

export interface D1ExpireHeldBookingInput {
  bookingId: string;

  expectedSeatHoldExpiresAt:
    string;

  passengerCount:
    number;

  tripInventoryId:
    string;

  returnTripInventoryId:
    string | null;

  nowTimestamp:
    number;
}

export interface D1ExpireHeldBookingResult {
  bookingStatus:
    "Cancelled";

  paymentStatus:
    "Pending";

  seatHoldExpiresAt:
    null;

  releasedSeats:
    number;

  inventoryIds:
    string[];
}

function normalizeD1ExpiryTimestamp(
  value: string,
  label: string,
): {
  text: string;
  timestamp: number;
} {
  const text =
    cleanRequiredText(
      value,
      label,
    );

  const timestamp =
    Date.parse(
      text,
    );

  if (
    !Number.isFinite(
      timestamp,
    )
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      `${label} is missing or invalid.`,
    );
  }

  return {
    text,
    timestamp,
  };
}

function normalizeD1NowTimestamp(
  value: number,
): {
  timestamp: number;
  iso: string;
} {
  if (
    !Number.isFinite(
      value,
    ) ||
    value < 0
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      "Cleanup time is invalid.",
    );
  }

  const timestamp =
    Math.trunc(
      value,
    );

  return {
    timestamp,

    iso:
      new Date(
        timestamp,
      ).toISOString(),
  };
}

export function buildD1ExpiredBookingAssertion(
  db: D1Database,
  {
    token,
    bookingId,
    expectedSeatHoldExpiresAt,
    cutoffIso,
    passengerCount,
    tripInventoryId,
    returnTripInventoryId,
  }: {
    token: string;

    bookingId: string;

    expectedSeatHoldExpiresAt:
      string;

    cutoffIso:
      string;

    passengerCount:
      number;

    tripInventoryId:
      string;

    returnTripInventoryId:
      string | null;
  },
): D1PreparedStatement {
  const assertionToken =
    cleanRequiredText(
      token,
      "Assertion token",
    );

  const id =
    cleanRequiredText(
      bookingId,
      "Booking ID",
    );

  const expiry =
    cleanRequiredText(
      expectedSeatHoldExpiresAt,
      "Seat hold expiry",
    );

  const cutoff =
    cleanRequiredText(
      cutoffIso,
      "Expiry cutoff",
    );

  const seats =
    positiveInteger(
      passengerCount,
      "Passenger count",
    );

  const outboundInventoryId =
    cleanRequiredText(
      tripInventoryId,
      "Trip inventory ID",
    );

  const returnInventoryId =
    nullableText(
      returnTripInventoryId,
    );

  if (
    returnInventoryId === null
  ) {
    return db
      .prepare(`
        INSERT INTO d1_transaction_assertions (
          token,
          ok
        )
        VALUES (
          ?,
          CASE
            WHEN EXISTS (
              SELECT 1
              FROM bookings AS b
              WHERE b.id = ?
                AND b.bookingStatus = 'Pending'
                AND b.paymentStatus = 'Pending'
                AND b.seatHoldExpiresAt = ?
                AND julianday(
                  b.seatHoldExpiresAt
                ) IS NOT NULL
                AND julianday(
                  b.seatHoldExpiresAt
                ) <= julianday(?)
                AND b.passengerCount = ?
                AND b.tripInventoryId = ?
                AND b.returnTripInventoryId IS NULL
            )
            THEN 1
            ELSE 0
          END
        )
      `)
      .bind(
        assertionToken,
        id,
        expiry,
        cutoff,
        seats,
        outboundInventoryId,
      );
  }

  return db
    .prepare(`
      INSERT INTO d1_transaction_assertions (
        token,
        ok
      )
      VALUES (
        ?,
        CASE
          WHEN EXISTS (
            SELECT 1
            FROM bookings AS b
            WHERE b.id = ?
              AND b.bookingStatus = 'Pending'
              AND b.paymentStatus = 'Pending'
              AND b.seatHoldExpiresAt = ?
              AND julianday(
                b.seatHoldExpiresAt
              ) IS NOT NULL
              AND julianday(
                b.seatHoldExpiresAt
              ) <= julianday(?)
              AND b.passengerCount = ?
              AND b.tripInventoryId = ?
              AND b.returnTripInventoryId = ?
          )
          THEN 1
          ELSE 0
        END
      )
    `)
    .bind(
      assertionToken,
      id,
      expiry,
      cutoff,
      seats,
      outboundInventoryId,
      returnInventoryId,
    );
}

export function buildD1ExpireHeldBookingUpdate(
  db: D1Database,
  bookingId: string,
): D1PreparedStatement {
  return db
    .prepare(`
      UPDATE bookings
      SET
        bookingStatus = 'Cancelled',
        paymentStatus = 'Pending',
        seatHoldExpiresAt = NULL
      WHERE id = ?
    `)
    .bind(
      cleanRequiredText(
        bookingId,
        "Booking ID",
      ),
    );
}

export async function expireD1HeldBooking(
  input: D1ExpireHeldBookingInput,
): Promise<D1ExpireHeldBookingResult> {
  const bookingId =
    cleanRequiredText(
      input.bookingId,
      "Booking ID",
    );

  const passengerCount =
    positiveInteger(
      input.passengerCount,
      "Passenger count",
    );

  const tripInventoryId =
    cleanRequiredText(
      input.tripInventoryId,
      "Trip inventory ID",
    );

  const returnTripInventoryId =
    nullableText(
      input.returnTripInventoryId,
    );

  if (
    returnTripInventoryId &&
    returnTripInventoryId ===
      tripInventoryId
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      "Outbound and return inventory IDs cannot be identical.",
    );
  }

  const expiry =
    normalizeD1ExpiryTimestamp(
      input.expectedSeatHoldExpiresAt,
      "Booking expiry",
    );

  const now =
    normalizeD1NowTimestamp(
      input.nowTimestamp,
    );

  /*
   * Mirrors processCandidate:
   * invalid/future expiry is not eligible
   * for cleanup.
   */
  if (
    expiry.timestamp >
    now.timestamp
  ) {
    throw new D1BookingDalError(
      "BUSINESS_RULE",
      "Booking is no longer expired.",
    );
  }

  const db =
    getD1();

  const bookingAssertionToken =
    makeD1BookingAssertionToken(
      "booking-expiry-state",
    );

  const outboundAssertionToken =
    makeD1BookingAssertionToken(
      "booking-expiry-outbound",
    );

  const returnAssertionToken =
    returnTripInventoryId
      ? makeD1BookingAssertionToken(
          "booking-expiry-return",
        )
      : null;

  const statements:
    D1PreparedStatement[] = [
      /*
       * Recheck the exact booking state
       * and expiry inside DB.batch.
       */
      buildD1ExpiredBookingAssertion(
        db,
        {
          token:
            bookingAssertionToken,

          bookingId,

          expectedSeatHoldExpiresAt:
            expiry.text,

          cutoffIso:
            now.iso,

          passengerCount,

          tripInventoryId,

          returnTripInventoryId,
        },
      ),

      /*
       * All inventory assertions are
       * also queued before any mutation.
       */
      buildD1LifecycleInventoryAssertion(
        db,
        {
          token:
            outboundAssertionToken,

          inventoryId:
            tripInventoryId,

          passengerCount,

          action:
            "release-held",
        },
      ),
    ];

  if (
    returnTripInventoryId &&
    returnAssertionToken
  ) {
    statements.push(
      buildD1LifecycleInventoryAssertion(
        db,
        {
          token:
            returnAssertionToken,

          inventoryId:
            returnTripInventoryId,

          passengerCount,

          action:
            "release-held",
        },
      ),
    );
  }

  statements.push(
    buildD1LifecycleSeatMutation(
      db,
      tripInventoryId,
      passengerCount,
      "release-held",
    ),

    buildD1NormalizeLifecycleSalesStatus(
      db,
      tripInventoryId,
    ),
  );

  if (
    returnTripInventoryId
  ) {
    statements.push(
      buildD1LifecycleSeatMutation(
        db,
        returnTripInventoryId,
        passengerCount,
        "release-held",
      ),

      buildD1NormalizeLifecycleSalesStatus(
        db,
        returnTripInventoryId,
      ),
    );
  }

  statements.push(
    buildD1ExpireHeldBookingUpdate(
      db,
      bookingId,
    ),

    buildD1DeleteAssertion(
      db,
      bookingAssertionToken,
    ),

    buildD1DeleteAssertion(
      db,
      outboundAssertionToken,
    ),
  );

  if (
    returnAssertionToken
  ) {
    statements.push(
      buildD1DeleteAssertion(
        db,
        returnAssertionToken,
      ),
    );
  }

  try {
    await db.batch(
      statements,
    );
  } catch (error) {
    throw toD1BookingDalError(
      error,
    );
  }

  const inventoryIds = [
    tripInventoryId,
  ];

  if (
    returnTripInventoryId
  ) {
    inventoryIds.push(
      returnTripInventoryId,
    );
  }

  return {
    bookingStatus:
      "Cancelled",

    paymentStatus:
      "Pending",

    seatHoldExpiresAt:
      null,

    releasedSeats:
      passengerCount *
      inventoryIds.length,

    inventoryIds,
  };
}
