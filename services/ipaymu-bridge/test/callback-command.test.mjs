import assert from "node:assert/strict";
import test from "node:test";

import {
  createCallbackSignature,
} from "../src/callback-signature.mjs";

import {
  handleCallbackCommand,
} from "../src/callback-command.mjs";

import {
  loadConfig,
} from "../src/config.mjs";

const testVa =
  "1179001234567890";

function readyConfig() {
  return loadConfig({
    IPAYMU_ENABLED: "true",
    IPAYMU_ENVIRONMENT:
      "sandbox",

    IPAYMU_API_BASE_URL:
      "https://sandbox.example.invalid/api",

    IPAYMU_VA:
      testVa,

    IPAYMU_API_KEY:
      "test-api-key",

    IPAYMU_BRIDGE_INTERNAL_TOKEN:
      "test-internal-token",

    APPWRITE_ENDPOINT:
      "https://appwrite.example.invalid/v1",

    APPWRITE_PROJECT_ID:
      "project-test",

    APPWRITE_API_KEY:
      "appwrite-api-key-test",

    APPWRITE_DATABASE_ID:
      "database-test",

    APPWRITE_BOOKINGS_TABLE_ID:
      "bookings-test",

    APPWRITE_TRIP_INVENTORY_TABLE_ID:
      "inventory-test",
  });
}

function successPayload() {
  return {
    buyer_email:
      "customer@example.com",

    reference_id:
      "NGB-TEST-001",

    referenceId:
      "NGB-TEST-001",

    sid:
      "SESSION-001",

    status:
      "berhasil",

    status_code:
      "1",

    transaction_status_code:
      "1",

    paid_off:
      "448500",

    trx_id:
      "12345678",

    is_escrow:
      "0",

    additional_info:
      [],
  };
}

function signedHeaders(
  payload,
  contentType,
  additional = {},
) {
  const signature =
    createCallbackSignature(
      payload,
      testVa,
    ).signature;

  return {
    "content-type":
      contentType,

    "x-signature":
      signature,

    ...additional,
  };
}

test(
  "accepts a valid JSON callback",
  async () => {
    const payload =
      successPayload();

    const processed = [];

    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers:
          signedHeaders(
            payload,
            "application/json; charset=utf-8",
            {
              "x-external-id":
                "CALLBACK-001",

              "x-timestamp":
                "2026-07-26T16:30:45+08:00",
            },
          ),

        rawBody:
          JSON.stringify(payload),

        processCallbackImpl:
          async (event) => {
            processed.push(event);

            return {
              duplicate: false,
            };
          },
      });

    assert.equal(
      result.statusCode,
      200,
    );

    assert.equal(
      processed.length,
      1,
    );

    assert.equal(
      processed[0].paymentState,
      "success",
    );

    assert.equal(
      processed[0].idempotencyKey,
      "external:CALLBACK-001",
    );

    assert.equal(
      result.body.callback
        .referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      result.body.callback
        .sessionId,
      "SESSION-001",
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
  "accepts URL-encoded callback and creates fallback idempotency key",
  async () => {
    const payload = {
      ...successPayload(),

      status:
        "pending",

      status_code:
        "0",

      transaction_status_code:
        "0",

      additional_info:
        "[]",
    };

    const form =
      new URLSearchParams();

    for (
      const [key, value]
      of Object.entries(payload)
    ) {
      form.set(
        key,
        Array.isArray(value)
          ? JSON.stringify(value)
          : String(value),
      );
    }

    const rawForm =
      form.toString();

    const parsedForSignature =
      Object.fromEntries(
        new URLSearchParams(rawForm),
      );

    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers:
          signedHeaders(
            parsedForSignature,
            "application/x-www-form-urlencoded",
          ),

        rawBody:
          rawForm,

        processCallbackImpl:
          async (event) => {
            assert.equal(
              event.paymentState,
              "pending",
            );

            assert.equal(
              event.idempotencyKey,
              "ipaymu:NGB-TEST-001:12345678:0:0",
            );

            return {
              duplicate: true,
            };
          },
      });

    assert.equal(
      result.statusCode,
      200,
    );

    assert.equal(
      result.body.duplicate,
      true,
    );

    assert.equal(
      result.body.callback
        .paymentState,
      "pending",
    );
  },
);

test(
  "rejects invalid callback signature before processing",
  async () => {
    let processCalls = 0;

    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers: {
          "content-type":
            "application/json",

          "x-signature":
            "0000000000000000000000000000000000000000000000000000000000000000",
        },

        rawBody:
          JSON.stringify(
            successPayload(),
          ),

        processCallbackImpl:
          async () => {
            processCalls += 1;
          },
      });

    assert.equal(
      result.statusCode,
      401,
    );

    assert.equal(
      result.body.code,
      "INVALID_CALLBACK_SIGNATURE",
    );

    assert.equal(
      processCalls,
      0,
    );
  },
);

test(
  "rejects unsupported callback content type",
  async () => {
    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers: {
          "content-type":
            "text/plain",
        },

        rawBody:
          "callback",
      });

    assert.equal(
      result.statusCode,
      415,
    );

    assert.equal(
      result.body.code,
      "UNSUPPORTED_CALLBACK_CONTENT_TYPE",
    );
  },
);

test(
  "rejects malformed callback JSON",
  async () => {
    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers: {
          "content-type":
            "application/json",
        },

        rawBody:
          "{invalid-json",
      });

    assert.equal(
      result.statusCode,
      400,
    );

    assert.equal(
      result.body.code,
      "INVALID_CALLBACK_BODY",
    );
  },
);

test(
  "keeps valid callback disconnected without processor",
  async () => {
    const payload =
      successPayload();

    const result =
      await handleCallbackCommand({
        config: readyConfig(),

        headers:
          signedHeaders(
            payload,
            "application/json",
          ),

        rawBody:
          JSON.stringify(payload),
      });

    assert.equal(
      result.statusCode,
      501,
    );

    assert.equal(
      result.body.code,
      "CALLBACK_PROCESSING_NOT_CONNECTED",
    );
  },
);

test(
  "disabled callback remains blocked",
  async () => {
    const result =
      await handleCallbackCommand({
        config: loadConfig({}),
        headers: {},
        rawBody: "",
      });

    assert.equal(
      result.statusCode,
      503,
    );

    assert.equal(
      result.body.code,
      "IPAYMU_BRIDGE_DISABLED",
    );
  },
);
