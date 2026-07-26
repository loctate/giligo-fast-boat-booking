import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestSignature,
} from "../src/request-signature.mjs";

import {
  buildRedirectPaymentRequest,
  formatIpaymuTimestamp,
} from "../src/redirect-payment-request.mjs";

const config = {
  apiBaseUrl:
    "https://sandbox.ipaymu.com/api",
  va: "1179001234567890",
  apiKey: "test-api-key-123",
};

const payload = {
  product: [
    "Fast Boat Ticket",
  ],

  qty: [
    2,
  ],

  price: [
    450000,
  ],

  description: [
    "Sanur to Nusa Penida",
  ],

  returnUrl:
    "https://nusagiliboat.com/booking/NGB-TEST?payment=success",

  notifyUrl:
    "https://nusagiliboat.com/api/payments/ipaymu/callback",

  cancelUrl:
    "https://nusagiliboat.com/booking/NGB-TEST?payment=cancelled",

  referenceId:
    "NGB-TEST-001",

  buyerName:
    "Test Customer",

  buyerEmail:
    "customer@example.com",

  buyerPhone:
    "081234567890",

  expired: 2,
};

test(
  "formats iPaymu timestamp",
  () => {
    assert.equal(
      formatIpaymuTimestamp(
        new Date(
          "2026-07-26T05:30:45.000Z",
        ),
      ),
      "20260726053045",
    );
  },
);

test(
  "builds redirect payment request",
  () => {
    const request =
      buildRedirectPaymentRequest({
        config,
        payload,
        now: new Date(
          "2026-07-26T05:30:45.000Z",
        ),
      });

    assert.equal(
      request.method,
      "POST",
    );

    assert.equal(
      request.url,
      "https://sandbox.ipaymu.com/api/v2/payment",
    );

    assert.equal(
      request.headers.va,
      config.va,
    );

    assert.equal(
      request.headers.timestamp,
      "20260726053045",
    );

    assert.match(
      request.headers.signature,
      /^[a-f0-9]{64}$/,
    );

    const parsed = JSON.parse(
      request.body,
    );

    assert.deepEqual(
      parsed.product,
      ["Fast Boat Ticket"],
    );

    assert.deepEqual(
      parsed.qty,
      ["2"],
    );

    assert.deepEqual(
      parsed.price,
      ["450000"],
    );

    assert.equal(
      parsed.referenceId,
      "NGB-TEST-001",
    );

    const expectedSignature =
      createRequestSignature({
        method: "POST",
        va: config.va,
        apiKey: config.apiKey,
        requestBody: request.body,
      }).signature;

    assert.equal(
      request.headers.signature,
      expectedSignature,
    );

    assert.equal(
      JSON.stringify(request).includes(
        config.apiKey,
      ),
      false,
    );
  },
);

test(
  "rejects mismatched item arrays",
  () => {
    assert.throws(
      () =>
        buildRedirectPaymentRequest({
          config,
          payload: {
            ...payload,
            qty: [1, 2],
          },
        }),
      /matching lengths/,
    );
  },
);

test(
  "rejects non-HTTPS callback URLs",
  () => {
    assert.throws(
      () =>
        buildRedirectPaymentRequest({
          config,
          payload: {
            ...payload,
            notifyUrl:
              "http://localhost/callback",
          },
        }),
      /must use HTTPS/,
    );
  },
);

test(
  "rejects invalid quantity and price",
  () => {
    assert.throws(
      () =>
        buildRedirectPaymentRequest({
          config,
          payload: {
            ...payload,
            qty: [0],
          },
        }),
      /positive integer/,
    );

    assert.throws(
      () =>
        buildRedirectPaymentRequest({
          config,
          payload: {
            ...payload,
            price: [-1],
          },
        }),
      /positive integer/,
    );
  },
);
