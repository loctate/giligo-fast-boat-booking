import assert from "node:assert/strict";
import test from "node:test";

import {
  createCallbackSignature,
} from "../src/callback-signature.mjs";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createBridgeServer,
} from "../src/server.mjs";

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
      "NGB-SERVER-001",

    referenceId:
      "NGB-SERVER-001",

    sid:
      "SESSION-SERVER-001",

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

async function startService(
  dependencies = {},
) {
  const server =
    createBridgeServer(
      readyConfig(),
      dependencies,
    );

  await new Promise(
    (resolve, reject) => {
      server.once(
        "error",
        reject,
      );

      server.listen(
        0,
        "127.0.0.1",
        resolve,
      );
    },
  );

  const address =
    server.address();

  if (
    !address
    || typeof address === "string"
  ) {
    throw new Error(
      "Unable to read server address.",
    );
  }

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`,

    close: () => new Promise(
      (resolve, reject) => {
        server.close(
          (error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          },
        );
      },
    ),
  };
}

function signatureFor(payload) {
  return createCallbackSignature(
    payload,
    testVa,
  ).signature;
}

test(
  "server callback remains disconnected without injected processor",
  async (t) => {
    const service =
      await startService();

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",
      },
    );

    assert.equal(
      response.status,
      501,
    );

    assert.equal(
      (await response.json()).code,
      "CALLBACK_PROCESSING_NOT_CONNECTED",
    );
  },
);

test(
  "server accepts valid JSON callback through injected processor",
  async (t) => {
    const payload =
      successPayload();

    const processed = [];

    const service =
      await startService({
        processCallbackImpl:
          async (event) => {
            processed.push(event);

            return {
              duplicate: false,
            };
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          "x-signature":
            signatureFor(payload),

          "x-external-id":
            "SERVER-CALLBACK-001",

          "x-timestamp":
            "2026-07-26T16:45:00+08:00",
        },

        body:
          JSON.stringify(payload),
      },
    );

    const body =
      await response.json();

    assert.equal(
      response.status,
      200,
    );

    assert.equal(
      processed.length,
      1,
    );

    assert.equal(
      processed[0].idempotencyKey,
      "external:SERVER-CALLBACK-001",
    );

    assert.equal(
      processed[0].paymentState,
      "success",
    );

    assert.equal(
      body.callback.referenceId,
      "NGB-SERVER-001",
    );

    assert.equal(
      body.callback.sessionId,
      "SESSION-SERVER-001",
    );

    const serialized =
      JSON.stringify(body);

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
  "server accepts valid URL-encoded callback",
  async (t) => {
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

    const rawBody =
      form.toString();

    const parsedForSignature =
      Object.fromEntries(
        new URLSearchParams(rawBody),
      );

    const service =
      await startService({
        processCallbackImpl:
          async (event) => {
            assert.equal(
              event.paymentState,
              "pending",
            );

            return {
              duplicate: true,
            };
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/x-www-form-urlencoded",

          "x-signature":
            signatureFor(
              parsedForSignature,
            ),
        },

        body:
          rawBody,
      },
    );

    const body =
      await response.json();

    assert.equal(
      response.status,
      200,
    );

    assert.equal(
      body.duplicate,
      true,
    );

    assert.equal(
      body.callback.paymentState,
      "pending",
    );
  },
);

test(
  "server rejects invalid signature before processor",
  async (t) => {
    let processorCalls = 0;

    const service =
      await startService({
        processCallbackImpl:
          async () => {
            processorCalls += 1;
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          "x-signature":
            "0000000000000000000000000000000000000000000000000000000000000000",
        },

        body:
          JSON.stringify(
            successPayload(),
          ),
      },
    );

    assert.equal(
      response.status,
      401,
    );

    assert.equal(
      (await response.json()).code,
      "INVALID_CALLBACK_SIGNATURE",
    );

    assert.equal(
      processorCalls,
      0,
    );
  },
);

test(
  "server rejects callback body above 64 KiB",
  async (t) => {
    let processorCalls = 0;

    const service =
      await startService({
        processCallbackImpl:
          async () => {
            processorCalls += 1;
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",

        headers: {
          "content-type":
            "application/json",

          "x-signature":
            "0000000000000000000000000000000000000000000000000000000000000000",
        },

        body:
          JSON.stringify({
            padding:
              "x".repeat(
                70 * 1024,
              ),
          }),
      },
    );

    assert.equal(
      response.status,
      413,
    );

    assert.equal(
      (await response.json()).code,
      "PAYLOAD_TOO_LARGE",
    );

    assert.equal(
      processorCalls,
      0,
    );
  },
);
