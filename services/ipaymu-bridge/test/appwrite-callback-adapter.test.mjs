import assert from "node:assert/strict";
import test from "node:test";

import {
  AppwriteCallbackAdapterError,
  createAppwriteCallbackAdapter,
} from "../src/appwrite-callback-adapter.mjs";

import {
  createCallbackProcessor,
} from "../src/callback-processor.mjs";

const config = {
  databaseId:
    "database-test",

  bookingsTableId:
    "bookings-test",

  tripInventoryTableId:
    "inventory-test",
};

function callbackEvent(
  overrides = {},
) {
  return {
    idempotencyKey:
      "external:CALLBACK-ADAPTER-001",

    externalId:
      "CALLBACK-ADAPTER-001",

    timestamp:
      "2026-07-27T00:30:00+08:00",

    paymentState:
      "success",

    trxId:
      99112233,

    sessionId:
      "SESSION-ADAPTER-001",

    referenceId:
      "GG-260727-TEST0001",

    statusCode:
      1,

    transactionStatusCode:
      1,

    paidOff:
      "500000",

    ...overrides,
  };
}

function bookingRow(
  overrides = {},
) {
  return {
    $id:
      "booking-row-001",

    bookingCode:
      "GG-260727-TEST0001",

    bookingStatus:
      "Pending",

    paymentStatus:
      "Pending",

    passengerCount:
      2,

    tripType:
      "one-way",

    tripInventoryId:
      "inventory-outbound",

    returnTripInventoryId:
      null,

    seatHoldExpiresAt:
      "2026-07-27T01:00:00+08:00",

    ...overrides,
  };
}

function inventoryRow(
  overrides = {},
) {
  return {
    $id:
      "inventory-outbound",

    seatCapacity:
      10,

    bookedSeats:
      2,

    heldSeats:
      3,

    salesStatus:
      "OPEN",

    isActive:
      true,

    ...overrides,
  };
}

function createMockTables({
  lookupBooking =
    bookingRow(),

  transactionBooking =
    lookupBooking,

  inventories = {
    "inventory-outbound":
      inventoryRow(),
  },

  failMethod = null,
} = {}) {
  const calls = {
    listRows: [],
    createTransaction: [],
    getRow: [],
    updateRow: [],
    incrementRowColumn: [],
    decrementRowColumn: [],
    updateTransaction: [],
  };

  const maybeFail = (
    method,
  ) => {
    if (failMethod === method) {
      throw new Error(
        `Mock ${method} failure`,
      );
    }
  };

  const tablesDB = {
    async listRows(args) {
      calls.listRows.push(args);
      maybeFail("listRows");

      return {
        rows:
          lookupBooking
            ? [lookupBooking]
            : [],
      };
    },

    async createTransaction(args) {
      calls.createTransaction.push(
        args,
      );

      maybeFail(
        "createTransaction",
      );

      return {
        $id:
          "transaction-test-001",
      };
    },

    async getRow(args) {
      calls.getRow.push(args);
      maybeFail("getRow");

      if (
        args.tableId ===
          config.bookingsTableId
      ) {
        return transactionBooking;
      }

      if (
        args.tableId ===
          config.tripInventoryTableId
      ) {
        const row =
          inventories[args.rowId];

        if (!row) {
          const error =
            new Error(
              "Inventory not found",
            );

          error.code = 404;
          throw error;
        }

        return row;
      }

      throw new Error(
        "Unexpected table ID.",
      );
    },

    async updateRow(args) {
      calls.updateRow.push(args);
      maybeFail("updateRow");

      return {
        $id:
          args.rowId,

        ...args.data,
      };
    },

    async incrementRowColumn(args) {
      calls.incrementRowColumn.push(
        args,
      );

      maybeFail(
        "incrementRowColumn",
      );

      return {};
    },

    async decrementRowColumn(args) {
      calls.decrementRowColumn.push(
        args,
      );

      maybeFail(
        "decrementRowColumn",
      );

      return {};
    },

    async updateTransaction(args) {
      calls.updateTransaction.push(
        args,
      );

      maybeFail(
        "updateTransaction",
      );

      return {};
    },
  };

  return {
    tablesDB,
    calls,
  };
}

function createAdapter(
  mock,
) {
  return createAppwriteCallbackAdapter({
    tablesDB:
      mock.tablesDB,

    appwriteConfig:
      config,

    queryEqualImpl:
      (column, values) => ({
        type:
          "equal",

        column,
        values,
      }),

    queryLimitImpl:
      (limit) => ({
        type:
          "limit",

        limit,
      }),
  });
}

test(
  "finds booking by bookingCode with bounded query",
  async () => {
    const mock =
      createMockTables();

    const adapter =
      createAdapter(mock);

    const rows =
      await adapter
        .findBookingByCodeImpl(
          "GG-260727-TEST0001",
        );

    assert.equal(
      rows.length,
      1,
    );

    assert.deepEqual(
      mock.calls
        .listRows[0]
        .queries,
      [
        {
          type:
            "equal",

          column:
            "bookingCode",

          values: [
            "GG-260727-TEST0001",
          ],
        },

        {
          type:
            "limit",

          limit:
            2,
        },
      ],
    );
  },
);

test(
  "applies one-way success atomically",
  async () => {
    const mock =
      createMockTables();

    const adapter =
      createAdapter(mock);

    const processor =
      createCallbackProcessor({
        ...adapter,
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      result.duplicate,
      false,
    );

    assert.equal(
      mock.calls
        .createTransaction[0]
        .ttl,
      60,
    );

    assert.equal(
      mock.calls
        .decrementRowColumn
        .length,
      1,
    );

    assert.equal(
      mock.calls
        .decrementRowColumn[0]
        .column,
      "heldSeats",
    );

    assert.equal(
      mock.calls
        .incrementRowColumn
        .length,
      1,
    );

    assert.equal(
      mock.calls
        .incrementRowColumn[0]
        .column,
      "bookedSeats",
    );

    const bookingUpdate =
      mock.calls.updateRow.find(
        (call) =>
          call.tableId ===
            config.bookingsTableId,
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
      mock.calls
        .updateTransaction
        .at(-1)
        .commit,
      true,
    );
  },
);

test(
  "applies round-trip success to both inventories",
  async () => {
    const row =
      bookingRow({
        tripType:
          "round-trip",

        returnTripInventoryId:
          "inventory-return",
      });

    const mock =
      createMockTables({
        lookupBooking:
          row,

        transactionBooking:
          row,

        inventories: {
          "inventory-outbound":
            inventoryRow({
              $id:
                "inventory-outbound",
            }),

          "inventory-return":
            inventoryRow({
              $id:
                "inventory-return",

              bookedSeats:
                1,

              heldSeats:
                2,
            }),
        },
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await processor(
      callbackEvent(),
    );

    assert.equal(
      mock.calls
        .decrementRowColumn
        .length,
      2,
    );

    assert.equal(
      mock.calls
        .incrementRowColumn
        .length,
      2,
    );

    assert.deepEqual(
      mock.calls
        .decrementRowColumn
        .map(
          (call) =>
            call.rowId,
        ),
      [
        "inventory-outbound",
        "inventory-return",
      ],
    );
  },
);

test(
  "expired callback releases held seats and reopens sold-out inventory",
  async () => {
    const mock =
      createMockTables({
        inventories: {
          "inventory-outbound":
            inventoryRow({
              seatCapacity:
                10,

              bookedSeats:
                8,

              heldSeats:
                2,

              salesStatus:
                "SOLD_OUT",
            }),
        },
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await processor(
      callbackEvent({
        paymentState:
          "expired",

        statusCode:
          -2,
      }),
    );

    assert.equal(
      mock.calls
        .incrementRowColumn
        .length,
      0,
    );

    const inventoryUpdate =
      mock.calls.updateRow.find(
        (call) =>
          call.tableId ===
            config.tripInventoryTableId,
      );

    assert.deepEqual(
      inventoryUpdate.data,
      {
        salesStatus:
          "OPEN",
      },
    );

    const bookingUpdate =
      mock.calls.updateRow.find(
        (call) =>
          call.tableId ===
            config.bookingsTableId,
      );

    assert.deepEqual(
      bookingUpdate.data,
      {
        bookingStatus:
          "Cancelled",

        paymentStatus:
          "Pending",

        seatHoldExpiresAt:
          null,
      },
    );
  },
);

test(
  "race to confirmed state returns duplicate and rolls back",
  async () => {
    const mock =
      createMockTables({
        lookupBooking:
          bookingRow(),

        transactionBooking:
          bookingRow({
            bookingStatus:
              "Confirmed",

            paymentStatus:
              "Paid",
          }),
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      result.duplicate,
      true,
    );

    assert.equal(
      mock.calls
        .decrementRowColumn
        .length,
      0,
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .at(-1)
        .rollback,
      true,
    );
  },
);

test(
  "late success race requires manual review",
  async () => {
    const mock =
      createMockTables({
        lookupBooking:
          bookingRow(),

        transactionBooking:
          bookingRow({
            bookingStatus:
              "Cancelled",

            paymentStatus:
              "Pending",
          }),
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      (error) => {
        assert.equal(
          error
            instanceof
              AppwriteCallbackAdapterError,
          true,
        );

        assert.equal(
          error.code,
          "CALLBACK_REQUIRES_MANUAL_REVIEW",
        );

        return true;
      },
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .at(-1)
        .rollback,
      true,
    );
  },
);

test(
  "rolls back transaction after inventory mutation failure",
  async () => {
    const mock =
      createMockTables({
        failMethod:
          "decrementRowColumn",
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      /Mock decrementRowColumn failure/,
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .at(-1)
        .rollback,
      true,
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .some(
          (call) =>
            call.commit === true,
        ),
      false,
    );
  },
);

test(
  "rejects round-trip booking without return inventory",
  async () => {
    const row =
      bookingRow({
        tripType:
          "round-trip",

        returnTripInventoryId:
          null,
      });

    const mock =
      createMockTables({
        lookupBooking:
          row,

        transactionBooking:
          row,
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      (error) => {
        assert.equal(
          error.code,
          "RETURN_INVENTORY_MISSING",
        );

        return true;
      },
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .at(-1)
        .rollback,
      true,
    );
  },
);

test(
  "rejects bookingCode mismatch inside transaction",
  async () => {
    const mock =
      createMockTables({
        lookupBooking:
          bookingRow(),

        transactionBooking:
          bookingRow({
            bookingCode:
              "GG-OTHER-CODE",
          }),
      });

    const processor =
      createCallbackProcessor({
        ...createAdapter(mock),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      (error) => {
        assert.equal(
          error.code,
          "BOOKING_REFERENCE_MISMATCH",
        );

        return true;
      },
    );

    assert.equal(
      mock.calls
        .updateTransaction
        .at(-1)
        .rollback,
      true,
    );
  },
);
