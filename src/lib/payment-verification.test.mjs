import assert from "node:assert/strict"
import test from "node:test"

import {
  isPaymentVerificationAllowed,
  isPaymentVerificationModeEnabled,
} from "./payment-verification.ts"

const originalMode =
  process.env.PAYMENT_VERIFICATION_MODE

const originalHash =
  process.env.PAYMENT_VERIFICATION_CODE_HASH

function restoreEnvironment() {
  if (originalMode === undefined) {
    delete process.env
      .PAYMENT_VERIFICATION_MODE
  } else {
    process.env.PAYMENT_VERIFICATION_MODE =
      originalMode
  }

  if (originalHash === undefined) {
    delete process.env
      .PAYMENT_VERIFICATION_CODE_HASH
  } else {
    process.env.PAYMENT_VERIFICATION_CODE_HASH =
      originalHash
  }
}

test(
  "missing mode remains fail closed",
  () => {
    delete process.env
      .PAYMENT_VERIFICATION_MODE

    assert.equal(
      isPaymentVerificationModeEnabled(),
      true
    )

    restoreEnvironment()
  }
)

test(
  "explicit disabled mode opens direct payment",
  () => {
    process.env.PAYMENT_VERIFICATION_MODE =
      "disabled"

    assert.equal(
      isPaymentVerificationModeEnabled(),
      false
    )

    assert.equal(
      isPaymentVerificationAllowed(""),
      true
    )

    restoreEnvironment()
  }
)

test(
  "enabled mode rejects missing verification code",
  () => {
    process.env.PAYMENT_VERIFICATION_MODE =
      "enabled"

    delete process.env
      .PAYMENT_VERIFICATION_CODE_HASH

    assert.equal(
      isPaymentVerificationAllowed(""),
      false
    )

    restoreEnvironment()
  }
)

test(
  "enabled mode accepts only matching verification code",
  () => {
    process.env.PAYMENT_VERIFICATION_MODE =
      "enabled"

    process.env.PAYMENT_VERIFICATION_CODE_HASH =
      "74d7bd157e514b04f3d988c58bcc92e5b64a46e288673a69d136109e0006827d"

    assert.equal(
      isPaymentVerificationAllowed(
        "nusagiliboat-test"
      ),
      true
    )

    assert.equal(
      isPaymentVerificationAllowed(
        "wrong-code"
      ),
      false
    )

    restoreEnvironment()
  }
)

process.on(
  "exit",
  restoreEnvironment
)
