import {
  buildCallbackLifecyclePlan,
} from "./callback-processor.mjs";

const supportedSeatActions =
  new Set([
    "held-to-booked",
    "release-held",
  ]);

export class
AppwriteCallbackAdapterError
  extends Error {
  constructor(code, message) {
    super(message);

    this.name =
      "AppwriteCallbackAdapterError";

    this.code = code;
  }
}

function fail(code, message) {
  throw new AppwriteCallbackAdapterError(
    code,
    message,
  );
}

function cleanText(value) {
  return String(value ?? "").trim();
}

function requireText(value, label) {
  const cleaned =
    cleanText(value);

  if (!cleaned) {
    fail(
      "INVALID_ADAPTER_INPUT",
      `${label} must not be empty.`,
    );
  }

  return cleaned;
}

function optionalText(value) {
  const cleaned =
    cleanText(value);

  return cleaned || null;
}

function toInteger(value) {
  if (
    value === null
    || value === undefined
    || value === ""
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isInteger(parsed)
    ? parsed
    : null;
}

function requireSafeInteger(
  value,
  label,
) {
  if (!Number.isSafeInteger(value)) {
    fail(
      "INVALID_ADAPTER_INPUT",
      `${label} must be a safe integer.`,
    );
  }

  return value;
}

function requireObject(
  value,
  label,
) {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    fail(
      "INVALID_ADAPTER_INPUT",
      `${label} must be an object.`,
    );
  }

  return value;
}

function requireMethod(
  object,
  name,
) {
  if (
    object === null
    || typeof object !== "object"
    || typeof object[name] !== "function"
  ) {
    throw new TypeError(
      `${name} must be a function.`,
    );
  }
}

function validateConfig(config) {
  requireObject(
    config,
    "appwriteConfig",
  );

  return {
    databaseId:
      requireText(
        config.databaseId,
        "appwriteConfig.databaseId",
      ),

    bookingsTableId:
      requireText(
        config.bookingsTableId,
        "appwriteConfig.bookingsTableId",
      ),

    tripInventoryTableId:
      requireText(
        config.tripInventoryTableId,
        "appwriteConfig.tripInventoryTableId",
      ),
  };
}

function normalizeRows(result) {
  if (
    result === null
    || typeof result !== "object"
    || Array.isArray(result)
    || !Array.isArray(result.rows)
  ) {
    fail(
      "INVALID_APPWRITE_RESPONSE",
      "Appwrite listRows response must contain rows.",
    );
  }

  return result.rows;
}

function normalizeMutation(
  mutation,
) {
  requireObject(
    mutation,
    "mutation",
  );

  const seatAction =
    requireText(
      mutation.seatAction,
      "mutation.seatAction",
    );

  if (
    !supportedSeatActions.has(
      seatAction,
    )
  ) {
    fail(
      "UNSUPPORTED_SEAT_ACTION",
      "The callback adapter only supports held-to-booked and release-held.",
    );
  }

  return {
    bookingId:
      requireText(
        mutation.bookingId,
        "mutation.bookingId",
      ),

    bookingCode:
      requireText(
        mutation.bookingCode,
        "mutation.bookingCode",
      ),

    idempotencyKey:
      requireText(
        mutation.idempotencyKey,
        "mutation.idempotencyKey",
      ),

    providerTrxId:
      requireSafeInteger(
        mutation.providerTrxId,
        "mutation.providerTrxId",
      ),

    providerSessionId:
      optionalText(
        mutation.providerSessionId,
      ),

    providerExternalId:
      optionalText(
        mutation.providerExternalId,
      ),

    providerTimestamp:
      optionalText(
        mutation.providerTimestamp,
      ),

    paymentState:
      requireText(
        mutation.paymentState,
        "mutation.paymentState",
      ),

    statusCode:
      requireSafeInteger(
        mutation.statusCode,
        "mutation.statusCode",
      ),

    transactionStatusCode:
      requireSafeInteger(
        mutation.transactionStatusCode,
        "mutation.transactionStatusCode",
      ),

    paidOff:
      mutation.paidOff ?? null,

    currentBookingStatus:
      requireText(
        mutation.currentBookingStatus,
        "mutation.currentBookingStatus",
      ),

    currentPaymentStatus:
      requireText(
        mutation.currentPaymentStatus,
        "mutation.currentPaymentStatus",
      ),

    seatAction,

    nextBookingStatus:
      requireText(
        mutation.nextBookingStatus,
        "mutation.nextBookingStatus",
      ),

    nextPaymentStatus:
      requireText(
        mutation.nextPaymentStatus,
        "mutation.nextPaymentStatus",
      ),
  };
}

function eventFromMutation(
  mutation,
) {
  return {
    idempotencyKey:
      mutation.idempotencyKey,

    externalId:
      mutation.providerExternalId,

    timestamp:
      mutation.providerTimestamp,

    paymentState:
      mutation.paymentState,

    trxId:
      mutation.providerTrxId,

    sessionId:
      mutation.providerSessionId,

    referenceId:
      mutation.bookingCode,

    statusCode:
      mutation.statusCode,

    transactionStatusCode:
      mutation.transactionStatusCode,

    paidOff:
      mutation.paidOff,
  };
}

async function safeRollback(
  tablesDB,
  transactionId,
) {
  try {
    await tablesDB.updateTransaction({
      transactionId,
      rollback: true,
    });
  } catch {
    /*
     * Pertahankan error asli. Runtime
     * logging akan ditambahkan saat
     * dependency nyata disambungkan.
     */
  }
}

async function adjustInventory({
  tablesDB,
  config,
  transactionId,
  inventoryId,
  passengerCount,
  journey,
  seatAction,
}) {
  const inventory =
    await tablesDB.getRow({
      databaseId:
        config.databaseId,

      tableId:
        config.tripInventoryTableId,

      rowId:
        inventoryId,

      transactionId,
    });

  const seatCapacity =
    toInteger(
      inventory.seatCapacity,
    );

  const bookedSeats =
    toInteger(
      inventory.bookedSeats,
    );

  const heldSeats =
    toInteger(
      inventory.heldSeats,
    );

  if (
    seatCapacity === null
    || bookedSeats === null
    || heldSeats === null
    || seatCapacity < 0
    || bookedSeats < 0
    || heldSeats < 0
    || bookedSeats + heldSeats
      > seatCapacity
  ) {
    fail(
      "INVALID_INVENTORY_STATE",
      `The ${journey} inventory has invalid seat data.`,
    );
  }

  if (heldSeats < passengerCount) {
    fail(
      "INSUFFICIENT_HELD_SEATS",
      `The ${journey} inventory does not contain enough held seats.`,
    );
  }

  let nextBookedSeats =
    bookedSeats;

  let nextHeldSeats =
    heldSeats;

  await tablesDB.decrementRowColumn({
    databaseId:
      config.databaseId,

    tableId:
      config.tripInventoryTableId,

    rowId:
      inventoryId,

    column:
      "heldSeats",

    value:
      passengerCount,

    min:
      0,

    transactionId,
  });

  nextHeldSeats -=
    passengerCount;

  if (
    seatAction ===
      "held-to-booked"
  ) {
    await tablesDB.incrementRowColumn({
      databaseId:
        config.databaseId,

      tableId:
        config.tripInventoryTableId,

      rowId:
        inventoryId,

      column:
        "bookedSeats",

      value:
        passengerCount,

      max:
        seatCapacity -
        nextHeldSeats,

      transactionId,
    });

    nextBookedSeats +=
      passengerCount;
  }

  const availableSeats =
    seatCapacity -
    nextBookedSeats -
    nextHeldSeats;

  if (availableSeats < 0) {
    fail(
      "INVALID_INVENTORY_RESULT",
      `The ${journey} inventory would exceed capacity.`,
    );
  }

  const salesStatus =
    cleanText(
      inventory.salesStatus,
    ).toUpperCase();

  let nextSalesStatus =
    salesStatus;

  if (
    availableSeats <= 0
    && salesStatus === "OPEN"
  ) {
    await tablesDB.updateRow({
      databaseId:
        config.databaseId,

      tableId:
        config.tripInventoryTableId,

      rowId:
        inventoryId,

      data: {
        salesStatus:
          "SOLD_OUT",
      },

      transactionId,
    });

    nextSalesStatus =
      "SOLD_OUT";
  } else if (
    availableSeats > 0
    && salesStatus === "SOLD_OUT"
  ) {
    await tablesDB.updateRow({
      databaseId:
        config.databaseId,

      tableId:
        config.tripInventoryTableId,

      rowId:
        inventoryId,

      data: {
        salesStatus:
          "OPEN",
      },

      transactionId,
    });

    nextSalesStatus =
      "OPEN";
  }

  return {
    journey,
    inventoryId,
    seatAction,
    passengerCount,
    bookedSeats:
      nextBookedSeats,
    heldSeats:
      nextHeldSeats,
    availableSeats,
    salesStatus:
      nextSalesStatus,
  };
}

export function
createAppwriteCallbackAdapter({
  tablesDB,
  appwriteConfig,
  queryEqualImpl,
  queryLimitImpl,
  transactionTtl = 60,
} = {}) {
  requireMethod(
    tablesDB,
    "listRows",
  );

  requireMethod(
    tablesDB,
    "createTransaction",
  );

  requireMethod(
    tablesDB,
    "getRow",
  );

  requireMethod(
    tablesDB,
    "updateRow",
  );

  requireMethod(
    tablesDB,
    "incrementRowColumn",
  );

  requireMethod(
    tablesDB,
    "decrementRowColumn",
  );

  requireMethod(
    tablesDB,
    "updateTransaction",
  );

  if (
    typeof queryEqualImpl
      !== "function"
  ) {
    throw new TypeError(
      "queryEqualImpl must be a function.",
    );
  }

  if (
    typeof queryLimitImpl
      !== "function"
  ) {
    throw new TypeError(
      "queryLimitImpl must be a function.",
    );
  }

  if (
    !Number.isSafeInteger(
      transactionTtl,
    )
    || transactionTtl < 1
    || transactionTtl > 3600
  ) {
    throw new TypeError(
      "transactionTtl must be between 1 and 3600 seconds.",
    );
  }

  const config =
    validateConfig(
      appwriteConfig,
    );

  async function
  findBookingByCodeImpl(
    bookingCode,
  ) {
    const normalizedCode =
      requireText(
        bookingCode,
        "bookingCode",
      );

    const result =
      await tablesDB.listRows({
        databaseId:
          config.databaseId,

        tableId:
          config.bookingsTableId,

        queries: [
          queryEqualImpl(
            "bookingCode",
            [normalizedCode],
          ),

          queryLimitImpl(2),
        ],
      });

    return normalizeRows(
      result,
    );
  }

  async function
  applyLifecycleImpl(
    rawMutation,
  ) {
    const mutation =
      normalizeMutation(
        rawMutation,
      );

    let transactionId =
      null;

    try {
      const transaction =
        await tablesDB
          .createTransaction({
            ttl:
              transactionTtl,
          });

      transactionId =
        requireText(
          transaction?.$id,
          "transaction.$id",
        );

      const booking =
        await tablesDB.getRow({
          databaseId:
            config.databaseId,

          tableId:
            config.bookingsTableId,

          rowId:
            mutation.bookingId,

          transactionId,
        });

      const currentCode =
        requireText(
          booking.bookingCode,
          "booking.bookingCode",
        );

      if (
        currentCode !==
        mutation.bookingCode
      ) {
        fail(
          "BOOKING_REFERENCE_MISMATCH",
          "The transaction bookingCode no longer matches the callback reference.",
        );
      }

      const currentPlan =
        buildCallbackLifecyclePlan({
          event:
            eventFromMutation(
              mutation,
            ),

          booking,
        });

      if (
        currentPlan.kind
          !== "transition"
      ) {
        await tablesDB
          .updateTransaction({
            transactionId,
            rollback:
              true,
          });

        transactionId =
          null;

        if (
          currentPlan.kind
            === "manual-review"
        ) {
          fail(
            "CALLBACK_REQUIRES_MANUAL_REVIEW",
            currentPlan.reason,
          );
        }

        return {
          duplicate: true,
          applied: false,
          reason:
            currentPlan.reason,
        };
      }

      if (
        currentPlan.seatAction
          !== mutation.seatAction
        || currentPlan
          .nextBookingStatus
          !== mutation
            .nextBookingStatus
        || currentPlan
          .nextPaymentStatus
          !== mutation
            .nextPaymentStatus
      ) {
        fail(
          "LIFECYCLE_PLAN_MISMATCH",
          "The callback lifecycle changed before the atomic update.",
        );
      }

      const passengerCount =
        toInteger(
          booking.passengerCount,
        );

      if (
        passengerCount === null
        || passengerCount < 1
      ) {
        fail(
          "INVALID_BOOKING_PASSENGER_COUNT",
          "The booking passenger count is invalid.",
        );
      }

      const outboundInventoryId =
        cleanText(
          booking.tripInventoryId,
        )
        || cleanText(
          booking.tripId,
        );

      const returnInventoryId =
        cleanText(
          booking.returnTripInventoryId,
        );

      const tripType =
        cleanText(
          booking.tripType,
        ).toLowerCase();

      if (!outboundInventoryId) {
        fail(
          "OUTBOUND_INVENTORY_MISSING",
          "The booking outbound inventory ID is missing.",
        );
      }

      if (
        tripType === "round-trip"
        && !returnInventoryId
      ) {
        fail(
          "RETURN_INVENTORY_MISSING",
          "The round-trip booking return inventory ID is missing.",
        );
      }

      if (
        returnInventoryId
        && returnInventoryId ===
          outboundInventoryId
      ) {
        fail(
          "DUPLICATE_INVENTORY_REFERENCE",
          "Outbound and return inventory IDs cannot be identical.",
        );
      }

      const inventoryAdjustments =
        [];

      inventoryAdjustments.push(
        await adjustInventory({
          tablesDB,
          config,
          transactionId,
          inventoryId:
            outboundInventoryId,
          passengerCount,
          journey:
            "outbound",
          seatAction:
            currentPlan.seatAction,
        }),
      );

      if (returnInventoryId) {
        inventoryAdjustments.push(
          await adjustInventory({
            tablesDB,
            config,
            transactionId,
            inventoryId:
              returnInventoryId,
            passengerCount,
            journey:
              "return",
            seatAction:
              currentPlan.seatAction,
          }),
        );
      }

      await tablesDB.updateRow({
        databaseId:
          config.databaseId,

        tableId:
          config.bookingsTableId,

        rowId:
          mutation.bookingId,

        data: {
          bookingStatus:
            currentPlan
              .nextBookingStatus,

          paymentStatus:
            currentPlan
              .nextPaymentStatus,

          seatHoldExpiresAt:
            null,
        },

        transactionId,
      });

      await tablesDB
        .updateTransaction({
          transactionId,
          commit:
            true,
        });

      transactionId =
        null;

      return {
        duplicate: false,
        applied: true,
        inventoryAdjustments,
      };
    } catch (error) {
      if (transactionId) {
        await safeRollback(
          tablesDB,
          transactionId,
        );
      }

      throw error;
    }
  }

  return {
    findBookingByCodeImpl,
    applyLifecycleImpl,
  };
}
