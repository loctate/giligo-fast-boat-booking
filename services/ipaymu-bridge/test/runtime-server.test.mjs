import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createRuntimeBridgeServer,
} from "../src/server.mjs";

function readyConfig() {
  return loadConfig({
    IPAYMU_ENABLED: "true",
    IPAYMU_ENVIRONMENT:
      "sandbox",

    IPAYMU_API_BASE_URL:
      "https://sandbox.example.invalid/api",

    IPAYMU_VA:
      "test-va",

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

async function startRuntime({
  config,
  fetchImpl,
}) {
  const runtime =
    createRuntimeBridgeServer({
      config,
      fetchImpl,

      nowFactory:
        () => new Date(
          "2026-07-26T09:30:45.000Z",
        ),

      timeoutMs: 5000,
    });

  await new Promise(
    (resolve, reject) => {
      runtime.server.once(
        "error",
        reject,
      );

      runtime.server.listen(
        0,
        "127.0.0.1",
        resolve,
      );
    },
  );

  const address =
    runtime.server.address();

  if (
    !address
    || typeof address === "string"
  ) {
    throw new Error(
      "Unable to read runtime server address.",
    );
  }

  return {
    baseUrl:
      `http://127.0.0.1:${address.port}`,

    close: () => new Promise(
      (resolve, reject) => {
        runtime.server.close(
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

test(
  "disabled runtime remains disconnected",
  async (t) => {
    let providerCalls = 0;

    const runtime =
      await startRuntime({
        config: loadConfig({}),

        fetchImpl:
          async () => {
            providerCalls += 1;

            throw new Error(
              "Provider transport must not be called.",
            );
          },
      });

    t.after(runtime.close);

    const response = await fetch(
      `${runtime.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer unused",

          "content-type":
            "application/json",
        },

        body: "{}",
      },
    );

    const body =
      await response.json();

    assert.equal(
      response.status,
      503,
    );

    assert.equal(
      body.code,
      "IPAYMU_BRIDGE_DISABLED",
    );

    assert.equal(
      providerCalls,
      0,
    );
  },
);

test(
  "ready runtime routes transaction through injected provider transport",
  async (t) => {
    const providerCalls = [];

    const runtime =
      await startRuntime({
        config: readyConfig(),

        fetchImpl:
          async (url, options) => {
            providerCalls.push({
              url,
              options,
            });

            return {
              status: 200,

              text: async () =>
                JSON.stringify({
                  Status: 200,
                  Message: "Success",

                  Data: {
                    SessionID:
                      "SESSION-RUNTIME-001",

                    Url:
                      "https://sandbox.example.invalid/payment/session-runtime-001",
                  },
                }),
            };
          },
      });

    t.after(runtime.close);

    const response = await fetch(
      `${runtime.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer test-internal-token",

          "content-type":
            "application/json",
        },

        body:
          JSON.stringify(payload),
      },
    );

    const body =
      await response.json();

    assert.equal(
      response.status,
      201,
    );

    assert.equal(
      providerCalls.length,
      1,
    );

    assert.equal(
      providerCalls[0].url,
      "https://sandbox.example.invalid/api/v2/payment",
    );

    assert.equal(
      providerCalls[0]
        .options.method,
      "POST",
    );

    assert.equal(
      providerCalls[0]
        .options.headers.va,
      "test-va",
    );

    assert.match(
      providerCalls[0]
        .options.headers.signature,
      /^[a-f0-9]{64}$/,
    );

    assert.equal(
      body.payment.sessionId,
      "SESSION-RUNTIME-001",
    );

    assert.equal(
      body.payment.referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      body.payment.paymentUrl,
      "https://sandbox.example.invalid/payment/session-runtime-001",
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
