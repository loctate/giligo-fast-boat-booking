import {
  readFileSync,
} from "node:fs";

import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createRuntimeDependencies,
} from "../src/runtime-dependencies.mjs";

import {
  SERVICE_NAME,
  SERVICE_VERSION,
} from "../src/service-metadata.mjs";

const packageData = JSON.parse(
  readFileSync(
    new URL(
      "../package.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

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
  });
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
  "service metadata matches package version and config",
  () => {
    const config = loadConfig({});

    assert.equal(
      SERVICE_NAME,
      "nusagiliboat-ipaymu-bridge",
    );

    assert.equal(
      SERVICE_VERSION,
      packageData.version,
    );

    assert.equal(
      SERVICE_VERSION,
      "0.11.0",
    );

    assert.equal(
      config.serviceName,
      SERVICE_NAME,
    );

    assert.equal(
      config.serviceVersion,
      SERVICE_VERSION,
    );
  },
);

test(
  "disabled runtime returns no payment dependency",
  () => {
    const dependencies =
      createRuntimeDependencies({
        config: loadConfig({}),
      });

    assert.deepEqual(
      dependencies,
      {},
    );
  },
);

test(
  "incomplete enabled runtime remains disconnected",
  () => {
    const dependencies =
      createRuntimeDependencies({
        config: loadConfig({
          IPAYMU_ENABLED:
            "true",
        }),
      });

    assert.deepEqual(
      dependencies,
      {},
    );
  },
);

test(
  "ready runtime requires an injected transport",
  () => {
    assert.throws(
      () =>
        createRuntimeDependencies({
          config: readyConfig(),
        }),
      /fetchImpl must be a function/,
    );
  },
);

test(
  "ready runtime creates a lazy payment dependency",
  async () => {
    const calls = [];

    const dependencies =
      createRuntimeDependencies({
        config: readyConfig(),

        fetchImpl:
          async (url, options) => {
            calls.push({
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
                      "SESSION-001",

                    Url:
                      "https://sandbox.example.invalid/payment/session-001",
                  },
                }),
            };
          },

        nowFactory:
          () => new Date(
            "2026-07-26T08:30:45.000Z",
          ),

        timeoutMs: 5000,
      });

    assert.equal(
      typeof dependencies
        .createPaymentImpl,
      "function",
    );

    assert.equal(calls.length, 0);

    const payment =
      await dependencies
        .createPaymentImpl({
          config: readyConfig(),
          payload,
        });

    assert.equal(calls.length, 1);

    assert.equal(
      payment.sessionId,
      "SESSION-001",
    );

    assert.equal(
      payment.referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      payment.paymentUrl,
      "https://sandbox.example.invalid/payment/session-001",
    );

    assert.equal(
      JSON.stringify(payment)
        .includes("test-api-key"),
      false,
    );
  },
);

test(
  "runtime builder rejects invalid config",
  () => {
    assert.throws(
      () =>
        createRuntimeDependencies({
          config: null,
          fetchImpl:
            async () => {},
        }),
      /config must be an object/,
    );
  },
);
