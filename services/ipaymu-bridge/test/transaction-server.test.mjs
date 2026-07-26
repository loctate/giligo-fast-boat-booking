import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createBridgeServer,
} from "../src/server.mjs";

function enabledConfig() {
  return loadConfig({
    IPAYMU_ENABLED: "true",
    IPAYMU_ENVIRONMENT:
      "sandbox",
    IPAYMU_API_BASE_URL:
      "https://example.invalid/api",
    IPAYMU_VA: "test-va",
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

async function startServer(
  dependencies = {},
) {
  const server =
    createBridgeServer(
      enabledConfig(),
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

  const address = server.address();

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
        server.close((error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      },
    ),
  };
}

test(
  "server transaction route uses injected payment dependency",
  async (t) => {
    const received = [];

    const service =
      await startServer({
        createPaymentImpl:
          async ({ payload }) => {
            received.push(payload);

            return {
              sessionId:
                "IPAYMU-SESSION-001",

              referenceId:
                payload.referenceId,

              paymentUrl:
                "https://example.invalid/payment",

              total: 900000,
              fee: 0,
            };
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer test-internal-token",

          "content-type":
            "application/json",
        },

        body: JSON.stringify({
          referenceId:
            "NGB-TEST-001",
        }),
      },
    );

    const body = await response.json();

    assert.equal(
      response.status,
      201,
    );

    assert.equal(
      received.length,
      1,
    );

    assert.equal(
      received[0].referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      body.payment.sessionId,
      "IPAYMU-SESSION-001",
    );

    assert.equal(
      JSON.stringify(body).includes(
        "test-api-key",
      ),
      false,
    );

    assert.equal(
      JSON.stringify(body).includes(
        "test-internal-token",
      ),
      false,
    );
  },
);

test(
  "server rejects unauthorized transaction request",
  async (t) => {
    let called = false;

    const service =
      await startServer({
        createPaymentImpl:
          async () => {
            called = true;
          },
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer incorrect",

          "content-type":
            "application/json",
        },

        body: "{}",
      },
    );

    const body = await response.json();

    assert.equal(
      response.status,
      401,
    );

    assert.equal(
      body.code,
      "UNAUTHORIZED",
    );

    assert.equal(called, false);
  },
);

test(
  "server rejects request body above 64 KiB",
  async (t) => {
    const service =
      await startServer({
        createPaymentImpl:
          async () => ({
            sessionId: "unused",
          }),
      });

    t.after(service.close);

    const response = await fetch(
      `${service.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer test-internal-token",

          "content-type":
            "application/json",
        },

        body: JSON.stringify({
          value: "x".repeat(
            70 * 1024,
          ),
        }),
      },
    );

    const body = await response.json();

    assert.equal(
      response.status,
      413,
    );

    assert.equal(
      body.code,
      "PAYLOAD_TOO_LARGE",
    );
  },
);
