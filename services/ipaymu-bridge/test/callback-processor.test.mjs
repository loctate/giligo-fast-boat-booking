import assert from "node:assert/strict";
import test from "node:test";

import {
  CallbackProcessorError,
  buildCallbackLifecyclePlan,
  createCallbackProcessor,
} from "../src/callback-processor.mjs";

function callbackEvent(
  overrides = {},
) {
  return {
    idempotencyKey:
      "external:CALLBACK-001",

    externalId:
      "CALLBACK-001",

    timestamp:
      "2026-07-27T00:10:00+08:00",

    paymentState:
      "success",

    trxId:
      12345678,

    sessionId:
      "SESSION-001",

    referenceId:
      "NGB-MOCK-001",

    statusCode:
      1,

    transactionStatusCode:
      1,

    paidOff:
      "448500",

    ...overrides,
  };
}

function booking(
  overrides = {},
) {
  return {
    $id:
      "booking-row-001",

    bookingCode:
      "NGB-MOCK-001",

    bookingStatus:
      "Pending",

    paymentStatus:
      "Pending",

    ...overrides,
  };
}

test(
  "builds success held-to-booked plan",
  () => {
    const plan =
      buildCallbackLifecyclePlan({
        event:
          callbackEvent(),

        booking:
          booking(),
      });

    assert.equal(
      plan.kind,
      "transition",
    );

    assert.equal(
      plan.seatAction,
      "held-to-booked",
    );

    assert.equal(
      plan.nextBookingStatus,
      "Confirmed",
    );

    assert.equal(
      plan.nextPaymentStatus,
      "Paid",
    );
  },
);

test(
  "processor applies successful payment through injected lifecycle",
  async () => {
    const mutations = [];

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async (bookingCode) => {
            assert.equal(
              bookingCode,
              "NGB-MOCK-001",
            );

            return [
              booking(),
            ];
          },

        applyLifecycleImpl:
          async (mutation) => {
            mutations.push(
              mutation,
            );

            return {
              duplicate: false,
            };
          },
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      mutations.length,
      1,
    );

    assert.equal(
      mutations[0].providerTrxId,
      12345678,
    );

    assert.equal(
      mutations[0].seatAction,
      "held-to-booked",
    );

    assert.equal(
      mutations[0].nextBookingStatus,
      "Confirmed",
    );

    assert.equal(
      result.applied,
      true,
    );

    assert.equal(
      result.duplicate,
      false,
    );
  },
);

test(
  "confirmed paid booking treats success callback as duplicate",
  async () => {
    let mutationCalls = 0;

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking({
              bookingStatus:
                "Confirmed",

              paymentStatus:
                "Paid",
            }),
          ],

        applyLifecycleImpl:
          async () => {
            mutationCalls += 1;

            return {
              duplicate: false,
            };
          },
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      result.kind,
      "noop",
    );

    assert.equal(
      result.duplicate,
      true,
    );

    assert.equal(
      result.applied,
      false,
    );

    assert.equal(
      mutationCalls,
      0,
    );
  },
);

test(
  "expired pending booking maps to release-held and Cancelled Pending",
  () => {
    const plan =
      buildCallbackLifecyclePlan({
        event:
          callbackEvent({
            paymentState:
              "expired",

            statusCode:
              -2,
          }),

        booking:
          booking(),
      });

    assert.equal(
      plan.kind,
      "transition",
    );

    assert.equal(
      plan.seatAction,
      "release-held",
    );

    assert.equal(
      plan.nextBookingStatus,
      "Cancelled",
    );

    assert.equal(
      plan.nextPaymentStatus,
      "Pending",
    );
  },
);

test(
  "already cancelled expired callback is duplicate without mutation",
  async () => {
    let mutationCalls = 0;

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking({
              bookingStatus:
                "Cancelled",

              paymentStatus:
                "Pending",
            }),
          ],

        applyLifecycleImpl:
          async () => {
            mutationCalls += 1;

            return {
              duplicate: false,
            };
          },
      });

    const result =
      await processor(
        callbackEvent({
          paymentState:
            "expired",

          statusCode:
            -2,
        }),
      );

    assert.equal(
      result.duplicate,
      true,
    );

    assert.equal(
      result.applied,
      false,
    );

    assert.equal(
      mutationCalls,
      0,
    );
  },
);

test(
  "late success after seat release persists manual review metadata",
  async () => {
    const mutations = [];

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking({
              bookingStatus:
                "Cancelled",

              paymentStatus:
                "Pending",
            }),
          ],

        applyLifecycleImpl:
          async (mutation) => {
            mutations.push(
              mutation,
            );

            return {
              duplicate: false,
              applied: true,
              manualReview: true,
            };
          },
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      result.kind,
      "manual-review",
    );

    assert.equal(
      result.reason,
      "LATE_SUCCESS_AFTER_SEAT_RELEASE",
    );

    assert.equal(
      result.applied,
      true,
    );

    assert.equal(
      result.duplicate,
      false,
    );

    assert.equal(
      mutations.length,
      1,
    );

    assert.equal(
      mutations[0].seatAction,
      "none",
    );

    assert.equal(
      mutations[0].nextBookingStatus,
      "Cancelled",
    );

    assert.equal(
      mutations[0].nextPaymentStatus,
      "Pending",
    );

    assert.equal(
      mutations[0].paymentReviewRequired,
      true,
    );

    assert.equal(
      mutations[0].paymentReviewReason,
      "LATE_SUCCESS_AFTER_SEAT_RELEASE",
    );

    assert.equal(
      mutations[0].paymentReviewAt,
      "2026-07-26T16:10:00.000Z",
    );
  },
);

test(
  "stale pending callback cannot reverse a confirmed booking",
  async () => {
    let mutationCalls = 0;

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking({
              bookingStatus:
                "Confirmed",

              paymentStatus:
                "Paid",
            }),
          ],

        applyLifecycleImpl:
          async () => {
            mutationCalls += 1;

            return {
              duplicate: false,
            };
          },
      });

    const result =
      await processor(
        callbackEvent({
          paymentState:
            "pending",

          statusCode:
            0,
        }),
      );

    assert.equal(
      result.kind,
      "ignored",
    );

    assert.equal(
      result.reason,
      "STALE_PENDING_CALLBACK",
    );

    assert.equal(
      mutationCalls,
      0,
    );
  },
);

test(
  "unknown callback status requires review without mutation",
  async () => {
    let mutationCalls = 0;

    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking(),
          ],

        applyLifecycleImpl:
          async () => {
            mutationCalls += 1;

            return {
              duplicate: false,
            };
          },
      });

    const result =
      await processor(
        callbackEvent({
          paymentState:
            "unknown",

          statusCode:
            9,
        }),
      );

    assert.equal(
      result.kind,
      "manual-review",
    );

    assert.equal(
      result.reason,
      "UNKNOWN_PROVIDER_STATUS",
    );

    assert.equal(
      mutationCalls,
      0,
    );
  },
);

test(
  "rejects callback when booking does not exist",
  async () => {
    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [],

        applyLifecycleImpl:
          async () => ({
            duplicate: false,
          }),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      (error) => {
        assert.equal(
          error
            instanceof
              CallbackProcessorError,
          true,
        );

        assert.equal(
          error.code,
          "BOOKING_NOT_FOUND",
        );

        return true;
      },
    );
  },
);

test(
  "rejects non-unique booking lookup",
  async () => {
    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking(),
            booking({
              $id:
                "booking-row-002",
            }),
          ],

        applyLifecycleImpl:
          async () => ({
            duplicate: false,
          }),
      });

    await assert.rejects(
      () => processor(
        callbackEvent(),
      ),

      (error) => {
        assert.equal(
          error.code,
          "BOOKING_LOOKUP_NOT_UNIQUE",
        );

        return true;
      },
    );
  },
);

test(
  "preserves duplicate result from atomic lifecycle dependency",
  async () => {
    const processor =
      createCallbackProcessor({
        findBookingByCodeImpl:
          async () => [
            booking(),
          ],

        applyLifecycleImpl:
          async () => ({
            duplicate: true,
          }),
      });

    const result =
      await processor(
        callbackEvent(),
      );

    assert.equal(
      result.applied,
      true,
    );

    assert.equal(
      result.duplicate,
      true,
    );
  },
);
