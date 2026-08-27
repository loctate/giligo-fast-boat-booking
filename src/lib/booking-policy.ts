export const TERMS_POLICY_VERSION =
  "2026-08-26"

export const REFUND_POLICY_VERSION =
  "2026-07-24"

function cleanPolicyValue(
  value: unknown
): string {
  return String(value ?? "").trim()
}

export function hasCurrentBookingPolicyAcceptance(
  booking: Record<string, unknown>
): boolean {
  return (
    Boolean(
      cleanPolicyValue(
        booking.termsAcceptedAt
      )
    ) &&
    Boolean(
      cleanPolicyValue(
        booking.refundPolicyAcceptedAt
      )
    ) &&
    cleanPolicyValue(
      booking.termsVersion
    ) === TERMS_POLICY_VERSION &&
    cleanPolicyValue(
      booking.refundPolicyVersion
    ) === REFUND_POLICY_VERSION
  )
}
