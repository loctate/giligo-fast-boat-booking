import assert from "node:assert/strict";
import test from "node:test";

import {
  createCallbackSignature,
} from "../src/callback-signature.mjs";

import {
  loadConfig,
} from "../src/config.mjs";

import {
  createRuntimeDependencies,
} from "../src/runtime-dependencies.mjs";

import {
  createRuntimeBridgeServer,
} from "../src/server.mjs";

const testVa =
  "1179001234567890";

function readyConfig() {
  return loadConfig({
    IPAYMU_ENABLED:
      "true",

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

function callbackPayload() {
  return {
    buyer_email:
      "customer@example.com",

    reference_id:
      "NGB-RUNTIME-CALLBACK-001",

    referenceId:
      "NGB-RUNTIME-CALLBACK-001",

    sid:
      "SESSION-RUNTIME-CALLBACK-001",

    status:
      "berhasil",

    status_code:
      "1",

    transaction_status_code:
      "1",

    paid_off:
      "450000",

    trx_id:
      "99117722",

    is_escrow:
      "0",

    additional_info:
      [],
  };
}

function createMockSdk() {
  const calls = {
    setters: [],
    listRows: [],
    createTransaction: [],
    getRow: [],
    updateRow: [],
    incrementRowColumn: [],
    decrementRowColumn: [],
    updateTransaction: [],
    query: [],
  };

  const booking = {
    $id:
      "booking-runtime-001",

    bookingCode:
      "NGB-RUNTIME-CALLBACK-001",

    bookingStatus:
      "Pending",

    paymentStatus:
      "Pending",

    passengerCount:
      2,

    tripType:
      "one-way",

    tripInventoryId:
      "inventory-runtime-001",

    returnTripInventoryId:
      null,

    seatHoldExpiresAt:
      "2026-07-27T02:00:00+08:00",
  };

  const inventory = {
    $id:
      "inventory-runtime-001",

    seatCapacity:
      10,

    bookedSeats:
      3,

    heldSeats:
      2,

    salesStatus:
      "OPEN",

    isActive:
      true,
  };

  class MockClient {
    setEndpoint(value) {
      calls.setters.push([
        "endpoint",
        value,
      ]);

      return this;
    }

    setProject(value) {
      calls.setters.push([
        "project",
        value,
      ]);

      return this;
    }

    setKey(value) {
      calls.setters.push([
        "key",
        value,
      ]);

      return this;
    }
  }

  class MockTablesDB {
    constructor(client) {
      this.client = client;
    }

    async listRows(args) {
      calls.listRows.push(args);

      return {
        rows: [
          booking,
        ],
      };
    }

    async createTransaction(args) {
      calls.createTransaction.push(
        args,
      );

      return {
        $id:
          "appwrite-transaction-runtime-001",
      };
    }

    async getRow(args) {
      calls.getRow.push(args);

      if (
        args.tableId ===
        "bookings-test"
      ) {
        return booking;
      }

      if (
        args.tableId ===
        "inventory-test"
      ) {
        return inventory;
      }

      throw new Error(
        "Unexpected mock table.",
      );
    }

    async updateRow(args) {
      calls.updateRow.push(args);

      return {
        $id:
          args.rowId,

        ...args.data,
      };
    }

    async incrementRowColumn(args) {
      calls.incrementRowColumn.push(
        args,
      );

      return {};
    }

    async decrementRowColumn(args) {
      calls.decrementRowColumn.push(
        args,
      );

      return {};
    }

    async updateTransaction(args) {
      calls.updateTransaction.push(
        args,
      );

      return {};
    }
  }

  function MockQuery() {}

  MockQuery.equal =
    (column, values) => {
      calls.query.push({
        type:
          "equal",

        column,
        values,
      });

      return {
        type:
          "equal",

        column,
        values,
      };
    };

  MockQuery.limit =
    (limit) => {
      calls.query.push({
        type:
          "limit",

        limit,
      });

      return {
        type:
          "limit",

        limit,
      };
    };

  return {
    ClientCtor:
      MockClient,

    TablesDBCtor:
      MockTablesDB,

    QueryApi:
      MockQuery,

    calls,
  };
}

async function startRuntime({
  config,
  fetchImpl,
  sdk,
}) {
  const runtime =
    createRuntimeBridgeServer({
      config,
      fetchImpl,

      ClientCtor:
        sdk.ClientCtor,

      TablesDBCtor:
        sdk.TablesDBCtor,

      QueryApi:
        sdk.QueryApi,

      nowFactory:
        () => new Date(
          "2026-07-27T00:30:45.000Z",
        ),

      timeoutMs:
        5000,

      transactionTtl:
        60,
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

    close: () =>
      new Promise(
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

test(
  "ready runtime wires callback processor without database requests",
  () => {
    const sdk =
      createMockSdk();

    const dependencies =
      createRuntimeDependencies({
        config:
          readyConfig(),

        fetchImpl:
          async () => {
            throw new Error(
              "Provider transport must remain unused.",
            );
          },

        ClientCtor:
          sdk.ClientCtor,

        TablesDBCtor:
          sdk.TablesDBCtor,

        QueryApi:
          sdk.QueryApi,
      });

    assert.equal(
      typeof dependencies
        .createPaymentImpl,
      "function",
    );

    assert.equal(
      typeof dependencies
        .processCallbackImpl,
      "function",
    );

    assert.equal(
      sdk.calls.listRows.length,
      0,
    );

    assert.equal(
      sdk.calls.createTransaction.length,
      0,
    );

    assert.equal(
      sdk.calls.getRow.length,
      0,
    );
  },
);

test(
  "runtime callback server applies lifecycle through mocked Appwrite",
  async (t) => {
    const sdk =
      createMockSdk();

    let providerCalls = 0;

    const runtime =
      await startRuntime({
        config:
          readyConfig(),

        fetchImpl:
          async () => {
            providerCalls += 1;

            throw new Error(
              "Provider transport must remain unused.",
            );
          },

        sdk,
      });

    t.after(runtime.close);

    const payload =
      callbackPayload();

    const signature =
      createCallbackSignature(
        payload,
        testVa,
      ).signature;

    const response =
      await fetch(
        `${runtime.baseUrl}/ipaymu-bridge/callback`,
        {
          method:
            "POST",

          headers: {
            "content-type":
              "application/json",

            "x-signature":
              signature,

            "x-external-id":
              "RUNTIME-CALLBACK-001",

            "x-timestamp":
              "2026-07-27T08:30:00+08:00",
          },

          body:
            JSON.stringify(
              payload,
            ),
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
      false,
    );

    assert.equal(
      providerCalls,
      0,
    );

    assert.equal(
      sdk.calls.listRows.length,
      1,
    );

    assert.equal(
      sdk.calls.createTransaction.length,
      1,
    );

    assert.equal(
      sdk.calls.getRow.length,
      2,
    );

    assert.equal(
      sdk.calls.decrementRowColumn.length,
      1,
    );

    assert.equal(
      sdk.calls.decrementRowColumn[0].column,
      "heldSeats",
    );

    assert.equal(
      sdk.calls.incrementRowColumn.length,
      1,
    );

    assert.equal(
      sdk.calls.incrementRowColumn[0].column,
      "bookedSeats",
    );

    const bookingUpdate =
      sdk.calls.updateRow.find(
        (call) =>
          call.tableId ===
          "bookings-test",
      );

    assert.deepEqual(
      bookingUpdate.data,
      {
        bookingStatus:
          "Confirmed",

        paymentStatus:
          "Paid",

        seatHoldExpiresAt:
          null,
      },
    );

    assert.equal(
      sdk.calls.updateTransaction
        .at(-1).commit,
      true,
    );
  },
);
