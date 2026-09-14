-- NusaGiliBoat / GiliGo Fast Boat Booking
--
-- Internal D1 transactional business-state assertion table.
--
-- Each assertion exists only within one DB.batch transaction:
--
-- valid state:
--   INSERT ok = 1
--   -> continue transaction
--
-- invalid or stale state:
--   INSERT ok = 0
--   -> CHECK constraint failure
--   -> DB.batch transaction rolls back
--
-- Successful transactions delete the assertion row before commit.
--
-- This table is NOT:
-- - an audit log
-- - an idempotency store
-- - booking state
-- - seat state
-- - an application error-message store

CREATE TABLE d1_transaction_assertions (
  token TEXT PRIMARY KEY,

  ok INTEGER NOT NULL
    CHECK (ok = 1)
);
