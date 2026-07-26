import assert from "node:assert/strict";
import test from "node:test";

import {
  getReadiness,
  loadConfig,
} from "../src/config.mjs";

test("bridge is disabled by default", () => {
  const config = loadConfig({});
  const readiness = getReadiness(config);

  assert.equal(config.enabled, false);
  assert.equal(config.environment, "sandbox");
  assert.equal(config.port, 8080);
  assert.equal(config.prefix, "/ipaymu-bridge");

  assert.equal(readiness.ready, false);

  assert.deepEqual(
    readiness.missing,
    ["IPAYMU_ENABLED=true"],
  );
});

test("enabled incomplete config reports missing keys", () => {
  const config = loadConfig({
    IPAYMU_ENABLED: "true",
  });

  const readiness = getReadiness(config);

  assert.equal(readiness.ready, false);

  assert.deepEqual(
    readiness.missing,
    [
      "IPAYMU_API_BASE_URL",
      "IPAYMU_VA",
      "IPAYMU_API_KEY",
      "IPAYMU_BRIDGE_INTERNAL_TOKEN",
      "APPWRITE_ENDPOINT",
      "APPWRITE_PROJECT_ID",
      "APPWRITE_API_KEY",
      "APPWRITE_DATABASE_ID",
      "APPWRITE_BOOKINGS_TABLE_ID",
      "APPWRITE_TRIP_INVENTORY_TABLE_ID",
    ],
  );
});

test("complete test config becomes ready", () => {
  const config = loadConfig({
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

    PORT: "9090",
    IPAYMU_BRIDGE_PREFIX:
      "/ipaymu-bridge/",
  });

  const readiness = getReadiness(config);

  assert.equal(readiness.ready, true);
  assert.deepEqual(readiness.missing, []);
  assert.equal(config.port, 9090);
  assert.equal(config.prefix, "/ipaymu-bridge");

  assert.deepEqual(
    config.appwrite,
    {
      endpoint:
        "https://appwrite.example.invalid/v1",

      projectId:
        "project-test",

      apiKey:
        "appwrite-api-key-test",

      databaseId:
        "database-test",

      bookingsTableId:
        "bookings-test",

      tripInventoryTableId:
        "inventory-test",
    },
  );
});

test("invalid environment is rejected", () => {
  assert.throws(
    () => loadConfig({
      IPAYMU_ENVIRONMENT: "invalid",
    }),
    /must be sandbox or production/,
  );
});

test("invalid port is rejected", () => {
  assert.throws(
    () => loadConfig({
      PORT: "0",
    }),
    /PORT must be a positive integer/,
  );
});

test("invalid prefix is rejected", () => {
  assert.throws(
    () => loadConfig({
      IPAYMU_BRIDGE_PREFIX: "ipaymu",
    }),
    /must start with/,
  );
});
