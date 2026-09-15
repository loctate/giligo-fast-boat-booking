-- D1 booking policy acceptance parity.
--
-- These fields intentionally remain nullable.
-- Existing bookings and new bookings that have not explicitly
-- accepted the current Terms / Refund Policy must continue to
-- represent "not accepted".

ALTER TABLE bookings
ADD COLUMN termsAcceptedAt TEXT;

ALTER TABLE bookings
ADD COLUMN refundPolicyAcceptedAt TEXT;

ALTER TABLE bookings
ADD COLUMN termsVersion TEXT;

ALTER TABLE bookings
ADD COLUMN refundPolicyVersion TEXT;
