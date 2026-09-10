-- ============================================================
-- NusaGiliBoat
-- Cloudflare D1 Initial Schema
--
-- Draft based on existing Appwrite source contracts.
-- No production data assumptions are embedded here.
--
-- Appwrite mapping:
--   $id        -> id
--   $createdAt -> createdAt
--   $updatedAt -> updatedAt
--
-- Business field names intentionally remain camelCase to
-- minimize migration-layer changes.
-- ============================================================


-- ============================================================
-- OPERATORS
-- ============================================================

CREATE TABLE operators (
  id TEXT PRIMARY KEY,

  operatorCode TEXT NOT NULL,
  operatorName TEXT NOT NULL,

  contactPerson TEXT,
  phone TEXT,
  whatsapp TEXT,
  email TEXT,
  address TEXT,
  logoUrl TEXT,

  isActive INTEGER NOT NULL DEFAULT 1
    CHECK (isActive IN (0, 1)),

  notes TEXT,

  createdBy TEXT,
  updatedBy TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CONSTRAINT uq_operators_operatorCode
    UNIQUE (operatorCode)
);


-- ============================================================
-- VESSELS
-- ============================================================

CREATE TABLE vessels (
  id TEXT PRIMARY KEY,

  vesselCode TEXT NOT NULL,
  operatorId TEXT NOT NULL,

  vesselName TEXT NOT NULL,
  vesselType TEXT,
  registrationNumber TEXT,

  totalCapacity INTEGER NOT NULL
    CHECK (
      totalCapacity >= 1
      AND totalCapacity <= 1000
    ),

  activeCapacity INTEGER NOT NULL
    CHECK (
      activeCapacity >= 0
      AND activeCapacity <= 1000
      AND activeCapacity <= totalCapacity
    ),

  imageUrl TEXT,

  isActive INTEGER NOT NULL DEFAULT 1
    CHECK (isActive IN (0, 1)),

  notes TEXT,

  createdBy TEXT,
  updatedBy TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  FOREIGN KEY (operatorId)
    REFERENCES operators(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX idx_vessels_operatorId
  ON vessels(operatorId);


-- ============================================================
-- ROUTES
-- ============================================================

CREATE TABLE routes (
  id TEXT PRIMARY KEY,

  routeCode TEXT NOT NULL,

  fromPort TEXT NOT NULL,
  toPort TEXT NOT NULL,

  fromIsland TEXT,
  toIsland TEXT,

  estimatedDurationMinutes INTEGER NOT NULL
    CHECK (
      estimatedDurationMinutes >= 1
      AND estimatedDurationMinutes <= 1440
    ),

  isActive INTEGER NOT NULL DEFAULT 1
    CHECK (isActive IN (0, 1)),

  notes TEXT,

  createdBy TEXT,
  updatedBy TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CHECK (
    lower(trim(fromPort))
    <> lower(trim(toPort))
  )
);


-- ============================================================
-- TRIP SCHEDULES
-- ============================================================

CREATE TABLE trip_schedules (
  id TEXT PRIMARY KEY,

  scheduleCode TEXT NOT NULL,

  operatorId TEXT NOT NULL,
  vesselId TEXT NOT NULL,
  routeId TEXT NOT NULL,

  departureTime TEXT NOT NULL,
  arrivalTime TEXT NOT NULL,

  arrivalDayOffset INTEGER NOT NULL
    CHECK (
      arrivalDayOffset >= 0
      AND arrivalDayOffset <= 2
    ),

  operatingDays TEXT NOT NULL,

  bookingCutoffMinutes INTEGER NOT NULL
    CHECK (
      bookingCutoffMinutes >= 0
      AND bookingCutoffMinutes <= 10080
    ),

  isActive INTEGER NOT NULL DEFAULT 1
    CHECK (isActive IN (0, 1)),

  notes TEXT,

  createdBy TEXT,
  updatedBy TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  FOREIGN KEY (operatorId)
    REFERENCES operators(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (vesselId)
    REFERENCES vessels(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (routeId)
    REFERENCES routes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX idx_trip_schedules_operatorId
  ON trip_schedules(operatorId);

CREATE INDEX idx_trip_schedules_vesselId
  ON trip_schedules(vesselId);

CREATE INDEX idx_trip_schedules_routeId
  ON trip_schedules(routeId);


-- ============================================================
-- TRIP INVENTORY
-- ============================================================

CREATE TABLE trip_inventory (
  id TEXT PRIMARY KEY,

  inventoryCode TEXT NOT NULL,

  scheduleId TEXT NOT NULL,
  operatorId TEXT NOT NULL,
  vesselId TEXT NOT NULL,
  routeId TEXT NOT NULL,

  travelDate TEXT NOT NULL,

  departureTime TEXT NOT NULL,
  arrivalTime TEXT NOT NULL,

  arrivalDayOffset INTEGER NOT NULL
    CHECK (
      arrivalDayOffset >= 0
      AND arrivalDayOffset <= 2
    ),

  seatCapacity INTEGER NOT NULL
    CHECK (
      seatCapacity >= 0
      AND seatCapacity <= 1000
    ),

  bookedSeats INTEGER NOT NULL DEFAULT 0
    CHECK (bookedSeats >= 0),

  heldSeats INTEGER NOT NULL DEFAULT 0
    CHECK (heldSeats >= 0),

  adultPrice INTEGER NOT NULL
    CHECK (
      adultPrice >= 0
      AND adultPrice <= 1000000000
    ),

  childPrice INTEGER NOT NULL DEFAULT 0
    CHECK (
      childPrice >= 0
      AND childPrice <= 1000000000
    ),

  infantPrice INTEGER NOT NULL DEFAULT 0
    CHECK (
      infantPrice >= 0
      AND infantPrice <= 1000000000
    ),

  currency TEXT NOT NULL DEFAULT 'IDR'
    CHECK (
      length(currency) = 3
      AND currency = upper(currency)
    ),

  salesStatus TEXT NOT NULL DEFAULT 'OPEN'
    CHECK (
      salesStatus IN (
        'OPEN',
        'CLOSED',
        'CANCELLED',
        'SOLD_OUT'
      )
    ),

  isActive INTEGER NOT NULL DEFAULT 1
    CHECK (isActive IN (0, 1)),

  notes TEXT,

  createdBy TEXT,
  updatedBy TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CHECK (
    bookedSeats + heldSeats
    <= seatCapacity
  ),

  CONSTRAINT uq_trip_inventory_schedule_date
    UNIQUE (scheduleId, travelDate),

  FOREIGN KEY (scheduleId)
    REFERENCES trip_schedules(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (operatorId)
    REFERENCES operators(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (vesselId)
    REFERENCES vessels(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (routeId)
    REFERENCES routes(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Customer search:
-- routeId + travelDate + OPEN + active.
CREATE INDEX idx_trip_inventory_customer_search
  ON trip_inventory(
    routeId,
    travelDate,
    salesStatus,
    isActive
  );

-- Availability endpoint scans open/active inventory
-- and evaluates travelDate.
CREATE INDEX idx_trip_inventory_availability
  ON trip_inventory(
    salesStatus,
    isActive,
    travelDate
  );

CREATE INDEX idx_trip_inventory_operatorId
  ON trip_inventory(operatorId);

CREATE INDEX idx_trip_inventory_vesselId
  ON trip_inventory(vesselId);


-- ============================================================
-- BOOKINGS
-- ============================================================

CREATE TABLE bookings (
  id TEXT PRIMARY KEY,

  bookingCode TEXT NOT NULL,

  bookingStatus TEXT NOT NULL DEFAULT 'Pending'
    CHECK (
      bookingStatus IN (
        'Pending',
        'Confirmed',
        'Completed',
        'Cancelled'
      )
    ),

  paymentStatus TEXT NOT NULL DEFAULT 'Pending'
    CHECK (
      paymentStatus IN (
        'Demo',
        'Pending',
        'Paid',
        'Refunded'
      )
    ),

  seatHoldExpiresAt TEXT,

  paymentVerificationAllowed INTEGER NOT NULL DEFAULT 0
    CHECK (
      paymentVerificationAllowed IN (0, 1)
    ),

  paymentReviewRequired INTEGER NOT NULL DEFAULT 0
    CHECK (
      paymentReviewRequired IN (0, 1)
    ),

  paymentReviewReason TEXT,
  paymentReviewAt TEXT,

  tripType TEXT NOT NULL
    CHECK (
      tripType IN (
        'one-way',
        'round-trip'
      )
    ),

  departureDate TEXT NOT NULL,
  returnDate TEXT,

  passengerCount INTEGER NOT NULL
    CHECK (
      passengerCount >= 1
      AND passengerCount <= 20
    ),

  totalPrice INTEGER NOT NULL
    CHECK (totalPrice >= 0),

  customerFullName TEXT NOT NULL,
  customerEmail TEXT NOT NULL,
  customerWhatsapp TEXT NOT NULL,
  customerCountry TEXT NOT NULL,

  passengersJson TEXT NOT NULL,

  -- Historical outbound snapshot compatibility.
  tripId TEXT NOT NULL,

  tripInventoryId TEXT NOT NULL,
  returnTripInventoryId TEXT,

  inventoryCode TEXT NOT NULL,
  scheduleId TEXT NOT NULL,
  operatorId TEXT NOT NULL,
  vesselId TEXT NOT NULL,
  routeId TEXT NOT NULL,

  operatorName TEXT NOT NULL,
  vesselName TEXT NOT NULL,
  routeCode TEXT NOT NULL,

  fromPort TEXT NOT NULL,
  toPort TEXT NOT NULL,

  departureTime TEXT NOT NULL,
  arrivalTime TEXT NOT NULL,

  arrivalDayOffset INTEGER NOT NULL
    CHECK (
      arrivalDayOffset >= 0
      AND arrivalDayOffset <= 2
    ),

  duration TEXT NOT NULL,

  pricePerPassenger INTEGER NOT NULL
    CHECK (pricePerPassenger >= 0),

  currency TEXT NOT NULL
    CHECK (
      length(currency) = 3
      AND currency = upper(currency)
    ),

  checkInLocation TEXT NOT NULL,

  -- Full return-leg snapshot for round-trip bookings.
  returnTripJson TEXT,

  notes TEXT,

  createdAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  updatedAt TEXT NOT NULL
    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CONSTRAINT uq_bookings_bookingCode
    UNIQUE (bookingCode),

  FOREIGN KEY (tripInventoryId)
    REFERENCES trip_inventory(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,

  FOREIGN KEY (returnTripInventoryId)
    REFERENCES trip_inventory(id)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

-- Held-booking expiry worker:
-- bookingStatus=Pending
-- paymentStatus=Pending
-- seatHoldExpiresAt <= current time
CREATE INDEX idx_bookings_hold_expiry
  ON bookings(
    bookingStatus,
    paymentStatus,
    seatHoldExpiresAt
  );

CREATE INDEX idx_bookings_tripInventoryId
  ON bookings(tripInventoryId);

CREATE INDEX idx_bookings_returnTripInventoryId
  ON bookings(returnTripInventoryId);


-- ============================================================
-- AUTOMATIC UPDATED-AT PARITY
-- ============================================================
--
-- Appwrite automatically updates $updatedAt whenever a row is
-- modified. D1/SQLite does not do this automatically.
--
-- AFTER UPDATE triggers preserve that behavior for every
-- persisted application table.
--
-- The WHEN guard prevents recursion if recursive triggers are
-- enabled: the trigger-generated UPDATE changes updatedAt, so
-- the subsequent trigger invocation no longer satisfies the
-- equality condition.
-- ============================================================


CREATE TRIGGER trg_operators_updatedAt
AFTER UPDATE ON operators
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE operators
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;


CREATE TRIGGER trg_vessels_updatedAt
AFTER UPDATE ON vessels
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE vessels
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;


CREATE TRIGGER trg_routes_updatedAt
AFTER UPDATE ON routes
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE routes
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;


CREATE TRIGGER trg_trip_schedules_updatedAt
AFTER UPDATE ON trip_schedules
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE trip_schedules
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;


CREATE TRIGGER trg_trip_inventory_updatedAt
AFTER UPDATE ON trip_inventory
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE trip_inventory
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;


CREATE TRIGGER trg_bookings_updatedAt
AFTER UPDATE ON bookings
FOR EACH ROW
WHEN NEW.updatedAt = OLD.updatedAt
BEGIN
  UPDATE bookings
  SET updatedAt =
    CASE
      WHEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now') > OLD.updatedAt
        THEN strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
      ELSE strftime(
        '%Y-%m-%dT%H:%M:%fZ',
        OLD.updatedAt,
        '+0.001 seconds'
      )
    END
  WHERE id = NEW.id;
END;

-- ============================================================
-- NOTES
-- ============================================================
--
-- Intentionally NOT enforced here:
--
-- 1. vesselCode uniqueness
-- 2. routeCode uniqueness
-- 3. scheduleCode uniqueness
-- 4. inventoryCode uniqueness
--
-- Existing source audit has not yet proven those as database
-- uniqueness contracts.
--
-- Cross-table operational rules remain in the service layer:
--
-- - vessel belongs to selected operator
-- - OPEN inventory requires active schedule/operator/vessel/route
-- - inventory seatCapacity <= vessel activeCapacity
-- - travel date must match schedule operatingDays
-- - booking/payment transition matrix
-- - callback idempotency / manual-review lifecycle
--
-- Seat mutation must use guarded atomic D1 statements.
-- ============================================================
