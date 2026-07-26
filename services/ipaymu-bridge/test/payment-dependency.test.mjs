import assert from "node:assert/strict";
import test from "node:test";

import {
  createPaymentDependency,
} from "../src/payment-dependency.mjs";

const config = {
  apiBaseUrl:
    "https://sandbox.example.invalid/api",
  va: "test-va",
  apiKey: "test-api-key",
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
};

function jsonResponse(
  status,
  value,
) {
  return {
    status,

    text: async () =>
      JSON.stringify(value),
  };
}

test(
  "factory does not call transport until dependency is invoked",
  () => {
    let calls = 0;

    const dependency =
      createPaymentDependency({
        fetchImpl: async () => {
          calls += 1;
        },
      });

    assert.equal(
      typeof dependency,
      "function",
    );

    assert.equal(calls, 0);
  },
);

test(
  "dependency creates payment using injected transport and clock",
  async () => {
    const calls = [];

    const dependency =
      createPaymentDependency({
        fetchImpl:
          async (url, options) => {
            calls.push({
              url,
              options,
            });

            return jsonResponse(
              200,
              {
                Status: 200,
                Success: true,
                Message: "Success",

                Data: {
                  TransactionId:
                    "IPAYMU-TEST-001",

                  ReferenceId:
                    "NGB-TEST-001",

                  Url:
                    "https://sandbox.example.invalid/payment/test-001",

                  Total: 900000,
                  Fee: 0,
                },
              },
            );
          },

        nowFactory:
          () => new Date(
            "2026-07-26T07:30:45.000Z",
          ),

        timeoutMs: 5000,
      });

    const payment = await dependency({
      config,
      payload,
    });

    assert.equal(calls.length, 1);

    assert.equal(
      calls[0].url,
      "https://sandbox.example.invalid/api/v2/payment",
    );

    assert.equal(
      calls[0].options.headers.timestamp,
      "20260726073045",
    );

    assert.equal(
      calls[0].options.headers.va,
      "test-va",
    );

    assert.match(
      calls[0].options.headers.signature,
      /^[a-f0-9]{64}$/,
    );

    assert.equal(
      payment.transactionId,
      "IPAYMU-TEST-001",
    );

    assert.equal(
      payment.referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      JSON.stringify(payment).includes(
        "test-api-key",
      ),
      false,
    );
  },
);

test(
  "rejects missing injected transport",
  () => {
    assert.throws(
      () =>
        createPaymentDependency(),
      /fetchImpl must be a function/,
    );
  },
);

test(
  "rejects invalid clock result",
  async () => {
    const dependency =
      createPaymentDependency({
        fetchImpl:
          async () => {
            throw new Error(
              "must not be called",
            );
          },

        nowFactory:
          () => "invalid",
      });

    await assert.rejects(
      () =>
        dependency({
          config,
          payload,
        }),
      /must return a valid Date/,
    );
  },
);

test(
  "rejects invalid timeout",
  () => {
    assert.throws(
      () =>
        createPaymentDependency({
          fetchImpl: async () => {},
          timeoutMs: 0,
        }),
      /positive integer/,
    );
  },
);
