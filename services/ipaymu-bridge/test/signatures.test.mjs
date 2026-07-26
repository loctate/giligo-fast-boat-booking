import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestSignature,
} from "../src/request-signature.mjs";

import {
  createCallbackSignature,
  serializeCallbackPayload,
  verifyCallbackSignature,
} from "../src/callback-signature.mjs";

const testVa = "1179001234567890";
const testApiKey = "test-api-key-123";

test("creates deterministic POST request signature", () => {
  const requestBody =
    '{"product":["Fast Boat Ticket"],"qty":["1"],"price":["450000"],"returnUrl":"https://nusagiliboat.com/booking/NGB-TEST","notifyUrl":"https://nusagiliboat.com/api/payments/ipaymu/callback","cancelUrl":"https://nusagiliboat.com/booking/NGB-TEST?payment=cancelled","referenceId":"NGB-TEST-001"}';

  const result = createRequestSignature({
    method: "post",
    va: testVa,
    apiKey: testApiKey,
    requestBody,
  });

  assert.equal(
    result.bodyComponent,
    "0c98248d1b26fcf9f7286aa81529ae7b85156a270a90927481e3357462733375",
  );

  assert.equal(
    result.stringToSign,
    "POST:1179001234567890:0c98248d1b26fcf9f7286aa81529ae7b85156a270a90927481e3357462733375:test-api-key-123",
  );

  assert.equal(
    result.signature,
    "520156c7826b128b9555540a0451749dac34981ecd70336db33682ac7e9bc5f9",
  );
});

const callbackPayload = {
  buyer_email: "customer@example.com",
  reference_id: "NGB-TEST-001",
  status: "berhasil",
  status_code: "1",
  paid_off: "448500",
  trx_id: "12345678",
  url:
    "https://nusagiliboat.com/api/payments/ipaymu/callback",
  transaction_status_code: "1",
  is_escrow: "0",
  amount: "450000",
  referenceId: "NGB-TEST-001",
};

const expectedSerialized =
  '{"additional_info":[],"amount":"450000","buyer_email":"customer@example.com","is_escrow":false,"paid_off":448500,"referenceId":"NGB-TEST-001","reference_id":"NGB-TEST-001","status":"berhasil","status_code":1,"transaction_status_code":1,"trx_id":12345678,"url":"https:\\/\\/nusagiliboat.com\\/api\\/payments\\/ipaymu\\/callback"}';

const expectedCallbackSignature =
  "b151303ffed2781cf01a5c6bf6dbb364e98bfee611fa9c8e635b4af4f9bb0c58";

test("normalizes and serializes callback payload", () => {
  assert.equal(
    serializeCallbackPayload(callbackPayload),
    expectedSerialized,
  );
});

test("creates deterministic callback signature", () => {
  const result = createCallbackSignature(
    callbackPayload,
    testVa,
  );

  assert.equal(
    result.serializedPayload,
    expectedSerialized,
  );

  assert.equal(
    result.signature,
    expectedCallbackSignature,
  );
});

test("validates callback signature safely", () => {
  assert.equal(
    verifyCallbackSignature({
      rawPayload: callbackPayload,
      receivedSignature:
        expectedCallbackSignature,
      vaSecret: testVa,
    }),
    true,
  );

  assert.equal(
    verifyCallbackSignature({
      rawPayload: callbackPayload,
      receivedSignature:
        "0000000000000000000000000000000000000000000000000000000000000000",
      vaSecret: testVa,
    }),
    false,
  );
});
