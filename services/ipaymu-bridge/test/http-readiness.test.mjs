import test from "node:test";
import assert from "node:assert/strict";

import {
  getReadiness,
} from "../src/config.mjs";

function baseConfig() {
  return {
    enabled: true,

    apiBaseUrl:
      "https://sandbox.example.invalid/api",

    va: "1179000000000000",

    apiKey:
      "test-api-key",

    internalToken:
      "test-internal-token",

    callbackLifecycle: {
      endpoint:
        "https://nusagiliboat.com/api/internal/ipaymu/callback-lifecycle",

      token:
        "test-lifecycle-token",
    },

    appwrite: {
      endpoint: "",
      projectId: "",
      apiKey: "",
      databaseId: "",
      bookingsTableId: "",
      tripInventoryTableId: "",
    },
  };
}

test(
  "HTTP lifecycle mode is ready without Appwrite configuration",
  () => {
    const readiness =
      getReadiness(
        baseConfig(),
      );

    assert.equal(
      readiness.ready,
      true,
    );

    assert.deepEqual(
      readiness.missing,
      [],
    );
  },
);

test(
  "partial HTTP lifecycle configuration is rejected",
  () => {
    const config =
      baseConfig();

    config
      .callbackLifecycle
      .token = "";

    const readiness =
      getReadiness(config);

    assert.equal(
      readiness.ready,
      false,
    );

    assert.deepEqual(
      readiness.missing,
      [
        "IPAYMU_CALLBACK_LIFECYCLE_TOKEN",
      ],
    );
  },
);

test(
  "legacy mode still requires Appwrite when HTTP lifecycle is absent",
  () => {
    const config =
      baseConfig();

    config.callbackLifecycle = {
      endpoint: "",
      token: "",
    };

    const readiness =
      getReadiness(config);

    assert.equal(
      readiness.ready,
      false,
    );

    assert.ok(
      readiness.missing.includes(
        "APPWRITE_ENDPOINT",
      ),
    );

    assert.ok(
      readiness.missing.includes(
        "APPWRITE_PROJECT_ID",
      ),
    );
  },
);
