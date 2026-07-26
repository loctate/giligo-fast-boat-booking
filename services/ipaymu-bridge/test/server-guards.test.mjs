import assert from "node:assert/strict";
import test from "node:test";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createBridgeServer,
} from "../src/server.mjs";

async function startService(config) {
  const server =
    createBridgeServer(config);

  await new Promise(
    (resolve, reject) => {
      server.once("error", reject);

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

function enabledTestConfig() {
  return loadConfig({
    IPAYMU_ENABLED: "true",
    IPAYMU_ENVIRONMENT: "sandbox",
    IPAYMU_API_BASE_URL:
      "https://example.invalid/api",
    IPAYMU_VA: "test-va",
    IPAYMU_API_KEY: "test-api-key",
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

test(
  "disabled server exposes health and blocks writes",
  async (t) => {
    const service =
      await startService(
        loadConfig({}),
      );

    t.after(service.close);

    const health = await fetch(
      `${service.baseUrl}/ipaymu-bridge/health`,
    );

    const ready = await fetch(
      `${service.baseUrl}/ipaymu-bridge/ready`,
    );

    const transaction = await fetch(
      `${service.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",
      },
    );

    const callback = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",
      },
    );

    const unknown = await fetch(
      `${service.baseUrl}/ipaymu-bridge/unknown`,
    );

    assert.equal(health.status, 200);
    assert.equal(ready.status, 503);
    assert.equal(transaction.status, 503);
    assert.equal(callback.status, 503);
    assert.equal(unknown.status, 404);

    assert.equal(
      (await health.json()).enabled,
      false,
    );

    assert.equal(
      (await transaction.json()).code,
      "IPAYMU_BRIDGE_DISABLED",
    );

    assert.equal(
      (await callback.json()).code,
      "IPAYMU_BRIDGE_DISABLED",
    );
  },
);

test(
  "enabled bridge is ready but write handlers stay disconnected",
  async (t) => {
    const service =
      await startService(
        enabledTestConfig(),
      );

    t.after(service.close);

    const ready = await fetch(
      `${service.baseUrl}/ipaymu-bridge/ready`,
    );

    const transaction = await fetch(
      `${service.baseUrl}/ipaymu-bridge/transactions`,
      {
        method: "POST",

        headers: {
          authorization:
            "Bearer test-internal-token",

          "content-type":
            "application/json",
        },

        body: "{}",
      },
    );

    const callback = await fetch(
      `${service.baseUrl}/ipaymu-bridge/callback`,
      {
        method: "POST",
      },
    );

    assert.equal(ready.status, 200);
    assert.equal(transaction.status, 501);
    assert.equal(callback.status, 501);

    assert.equal(
      (await transaction.json()).code,
      "TRANSACTION_CREATION_NOT_CONNECTED",
    );

    assert.equal(
      (await callback.json()).code,
      "CALLBACK_PROCESSING_NOT_CONNECTED",
    );
  },
);

test(
  "health and readiness never expose secrets",
  async (t) => {
    const config =
      enabledTestConfig();

    const service =
      await startService(config);

    t.after(service.close);

    const healthText = await (
      await fetch(
        `${service.baseUrl}/ipaymu-bridge/health`,
      )
    ).text();

    const readyText = await (
      await fetch(
        `${service.baseUrl}/ipaymu-bridge/ready`,
      )
    ).text();

    for (const secret of [
      config.va,
      config.apiKey,
      config.internalToken,
      config.appwrite.apiKey,
    ]) {
      assert.equal(
        healthText.includes(secret),
        false,
      );

      assert.equal(
        readyText.includes(secret),
        false,
      );
    }
  },
);
