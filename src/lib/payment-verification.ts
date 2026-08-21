import {
  createHash,
  timingSafeEqual,
} from "node:crypto"

function cleanText(
  value: unknown
): string {
  return String(value ?? "").trim()
}

function normalizeMode(
  value: unknown
): string {
  return cleanText(value).toLowerCase()
}

function sha256Hex(
  value: string
): string {
  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex")
}

function isSha256Hex(
  value: string
): boolean {
  return /^[a-f0-9]{64}$/i.test(
    value
  )
}

export function isPaymentVerificationModeEnabled(): boolean {
  /*
   * Fail closed:
   * verification remains required when the
   * environment variable is absent, empty,
   * misspelled, or otherwise misconfigured.
   *
   * Only an explicit "disabled" value opens
   * online payment to every eligible booking.
   */
  return normalizeMode(
    process.env
      .PAYMENT_VERIFICATION_MODE
  ) !== "disabled"
}

export function isPaymentVerificationAllowed(
  suppliedCode: unknown
): boolean {
  if (
    !isPaymentVerificationModeEnabled()
  ) {
    /*
     * Direct-payment mode:
     * every otherwise eligible booking is
     * authorized for online payment.
     */
    return true
  }

  const code =
    cleanText(suppliedCode)

  if (!code || code.length > 200) {
    return false
  }

  const configuredHash =
    cleanText(
      process.env
        .PAYMENT_VERIFICATION_CODE_HASH
    ).toLowerCase()

  if (
    !isSha256Hex(
      configuredHash
    )
  ) {
    console.error(
      "Payment verification mode is enabled but PAYMENT_VERIFICATION_CODE_HASH is missing or invalid."
    )

    return false
  }

  const suppliedHash =
    sha256Hex(code)

  const suppliedBuffer =
    Buffer.from(
      suppliedHash,
      "hex"
    )

  const configuredBuffer =
    Buffer.from(
      configuredHash,
      "hex"
    )

  return timingSafeEqual(
    suppliedBuffer,
    configuredBuffer
  )
}
