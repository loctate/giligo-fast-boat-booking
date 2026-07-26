import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  IpaymuResponseError,
} from "../src/redirect-payment-response.mjs";

import {
  IpaymuTransportError,
} from "../src/redirect-payment-client.mjs";

import {
  handleTransactionCommand,
} from "../src/transaction-command.mjs";

function config() {
  return loadConfig({
    IPAYMU_ENABLED: "true",
    IPAYMU_ENVIRONMENT: "sandbox",
    IPAYMU_API_BASE_URL:
      "https://example.invalid/api",
    IPAYMU_VA: "test-va",
    IPAYMU_API_KEY: "test-api-key",
    IPAYMU_BRIDGE_INTERNAL_TOKEN:
      "test-internal-token",
  });
}

function request(overrides = {}) {
  return {
    config: config(),

    headers: {
      authorization:
        "Bearer test-internal-token",
      "content-type":
        "application/json",
    },

    rawBody: JSON.stringify({
      referenceId:
        "NGB-TEST-001",
    }),

    createPaymentImpl:
      async () => ({
        sessionId:
          "IPAYMU-SESSION-001",

        referenceId:
          "NGB-TEST-001",

        paymentUrl:
          "https://example.invalid/payment",

        total: 900000,
        fee: 0,
      }),

    ...overrides,
  };
}

test(
  "disabled bridge blocks command",
  async () => {
    let called = false;

    const result =
      await handleTransactionCommand({
        ...request(),
        config: loadConfig({}),
        createPaymentImpl:
          async () => {
            called = true;
          },
      });

    assert.equal(result.statusCode, 503);
    assert.equal(called, false);
  },
);

test(
  "rejects invalid internal token",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          headers: {
            authorization:
              "Bearer incorrect",
            "content-type":
              "application/json",
          },
        }),
      );

    assert.equal(result.statusCode, 401);
    assert.equal(
      result.body.code,
      "UNAUTHORIZED",
    );
  },
);

test(
  "rejects unsupported content type",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          headers: {
            authorization:
              "Bearer test-internal-token",
            "content-type":
              "text/plain",
          },
        }),
      );

    assert.equal(result.statusCode, 415);
  },
);

test(
  "rejects malformed JSON",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          rawBody: "{invalid",
        }),
      );

    assert.equal(result.statusCode, 400);
    assert.equal(
      result.body.code,
      "INVALID_REQUEST",
    );
  },
);

test(
  "returns safe successful payment response",
  async () => {
    const result =
      await handleTransactionCommand(
        request(),
      );

    assert.equal(result.statusCode, 201);

    assert.equal(
      result.body.payment.sessionId,
      "IPAYMU-SESSION-001",
    );

    const serialized =
      JSON.stringify(result.body);

    assert.equal(
      serialized.includes(
        "test-api-key",
      ),
      false,
    );

    assert.equal(
      serialized.includes(
        "test-internal-token",
      ),
      false,
    );
  },
);

test(
  "maps iPaymu API errors",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          createPaymentImpl:
            async () => {
              throw new IpaymuResponseError({
                status: 400,
                message:
                  "Provider rejected request",
              });
            },
        }),
      );

    assert.equal(result.statusCode, 502);
    assert.equal(
      result.body.code,
      "IPAYMU_API_ERROR",
    );
  },
);

test(
  "maps transport timeout",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          createPaymentImpl:
            async () => {
              throw new IpaymuTransportError({
                code: "TIMEOUT",
                message: "timeout",
              });
            },
        }),
      );

    assert.equal(result.statusCode, 504);
    assert.equal(
      result.body.code,
      "IPAYMU_TIMEOUT",
    );
  },
);

test(
  "keeps real client disconnected when dependency missing",
  async () => {
    const result =
      await handleTransactionCommand(
        request({
          createPaymentImpl:
            undefined,
        }),
      );

    assert.equal(result.statusCode, 501);
  },
);
