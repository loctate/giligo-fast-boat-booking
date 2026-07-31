import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createBridgeServer,
} from "../src/server.mjs";

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readyConfig() {
  return loadConfig({
    IPAYMU_ENABLED:
      "true",

    IPAYMU_ENVIRONMENT:
      "sandbox",

    IPAYMU_API_BASE_URL:
      "https://example.invalid/api",

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

function callbackPayload() {
  return {
    buyer_email:
      "customer@example.com",

    reference_id:
      "NGB-OBSERVABILITY-001",

    referenceId:
      "NGB-OBSERVABILITY-001",

    sid:
      "SESSION-OBSERVABILITY-001",

    status:
      "berhasil",

    status_code:
      "1",

    transaction_status_code:
      "1",

    paid_off:
      "450000",

    trx_id:
      "99887766",

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

    close: () =>
      new Promise(
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

test(
  "server returns a unique request correlation header",
  async (t) => {
    const service =
      await startService();

    t.after(service.close);

    const first =
      await fetch(
        `${service.baseUrl}/ipaymu-bridge/health`,
      );

    const second =
      await fetch(
        `${service.baseUrl}/ipaymu-bridge/health`,
      );

    const firstRequestId =
      first.headers.get(
        "x-request-id",
      );

    const secondRequestId =
      second.headers.get(
        "x-request-id",
      );

    assert.match(
      firstRequestId,
      uuidV4Pattern,
    );

    assert.match(
      secondRequestId,
      uuidV4Pattern,
    );

    assert.notEqual(
      firstRequestId,
      secondRequestId,
    );

    assert.equal(
      first.status,
      200,
    );

    assert.equal(
      second.status,
      200,
    );
  },
);

test(
  "server logs sanitized transaction and callback rejections",
  async (t) => {
    let paymentCalls = 0;
    let processorCalls = 0;

    const service =
      await startService({
        createPaymentImpl:
          async () => {
            paymentCalls += 1;
          },

        processCallbackImpl:
          async () => {
            processorCalls += 1;
          },
      });

    t.after(service.close);

    const originalWrite =
      process.stderr.write;

    const captured = [];

    let transactionResponse;
    let callbackResponse;
    let transactionBody;
    let callbackBody;

    try {
      process.stderr.write =
        (chunk) => {
          captured.push(
            String(chunk),
          );

          return true;
        };

      transactionResponse =
        await fetch(
          `${service.baseUrl}/ipaymu-bridge/transactions`,
          {
            method:
              "POST",

            headers: {
              authorization:
                "Bearer incorrect-token",

              "content-type":
                "application/json",
            },

            body:
              "{}",
          },
        );

      transactionBody =
        await transactionResponse.json();

      callbackResponse =
        await fetch(
          `${service.baseUrl}/ipaymu-bridge/callback`,
          {
            method:
              "POST",

            headers: {
              "content-type":
                "application/json",

              "x-signature":
                "0000000000000000000000000000000000000000000000000000000000000000",
            },

            body:
              JSON.stringify(
                callbackPayload(),
              ),
          },
        );

      callbackBody =
        await callbackResponse.json();
    } finally {
      process.stderr.write =
        originalWrite;
    }

    assert.equal(
      transactionResponse.status,
      401,
    );

    assert.deepEqual(
      transactionBody,
      {
        ok:
          false,

        code:
          "UNAUTHORIZED",
      },
    );

    assert.equal(
      callbackResponse.status,
      401,
    );

    assert.deepEqual(
      callbackBody,
      {
        ok:
          false,

        code:
          "INVALID_CALLBACK_SIGNATURE",
      },
    );

    assert.equal(
      paymentCalls,
      0,
    );

    assert.equal(
      processorCalls,
      0,
    );

    const transactionRequestId =
      transactionResponse.headers.get(
        "x-request-id",
      );

    const callbackRequestId =
      callbackResponse.headers.get(
        "x-request-id",
      );

    assert.match(
      transactionRequestId,
      uuidV4Pattern,
    );

    assert.match(
      callbackRequestId,
      uuidV4Pattern,
    );

    assert.notEqual(
      transactionRequestId,
      callbackRequestId,
    );

    assert.equal(
      captured.length,
      2,
    );

    const diagnostics =
      captured.map((line) =>
        JSON.parse(line)
      );

    assert.deepEqual(
      diagnostics,
      [
        {
          event:
            "ipaymu_auth_rejection",

          requestId:
            transactionRequestId,

          route:
            "transactions",

          statusCode:
            401,

          code:
            "UNAUTHORIZED",
        },
        {
          event:
            "ipaymu_auth_rejection",

          requestId:
            callbackRequestId,

          route:
            "callback",

          statusCode:
            401,

          code:
            "INVALID_CALLBACK_SIGNATURE",
        },
      ],
    );

    const serialized =
      JSON.stringify(
        diagnostics,
      );

    for (const forbiddenValue of [
      "incorrect-token",
      "test-internal-token",
      "test-api-key",
      "appwrite-api-key-test",
      "0000000000000000000000000000000000000000000000000000000000000000",
      "customer@example.com",
      "NGB-OBSERVABILITY-001",
    ]) {
      assert.equal(
        serialized.includes(
          forbiddenValue,
        ),
        false,
      );
    }
  },
);
