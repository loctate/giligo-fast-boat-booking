import { getD1 } from "@/lib/d1-server";

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

    passengerCount:
      positiveInteger(
        asInteger(
          row.passengerCount,
          "Passenger count",
        ),
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
    positiveInteger(
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
