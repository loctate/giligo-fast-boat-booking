import assert from "node:assert/strict";
import test from "node:test";

import {
  createHttpCallbackAdapter,
  HttpCallbackAdapterError,
} from "../src/http-callback-adapter.mjs";

test(
  "HTTP callback adapter performs authenticated booking lookup",
  async () => {
    const calls = [];

    const adapter =
      createHttpCallbackAdapter({
        endpoint:
          "https://example.test/api/internal/ipaymu/callback-lifecycle",

        token:
          "test-secret-token",

        fetchImpl:
          async (
            url,
            options,
          ) => {
            calls.push({
              url,
              options,
            });

            return Response.json({
              success: true,
              result: [
                {
                  id: "booking-1",
                  bookingCode:
                    "NGB-TEST-001",
                },
              ],
            });
          },
      });

    const rows =
      await adapter
        .findBookingByCodeImpl(
          "NGB-TEST-001",
        );

    assert.equal(
      rows.length,
      1,
    );

    assert.equal(
      calls.length,
      1,
    );

    assert.equal(
      calls[0]
        .options
        .headers
        .authorization,
      "Bearer test-secret-token",
    );

    const body =
      JSON.parse(
        calls[0].options.body,
      );

    assert.deepEqual(
      body,
      {
        operation:
          "lookup",

        bookingCode:
          "NGB-TEST-001",
      },
    );
  },
);

test(
  "HTTP callback adapter applies lifecycle mutation",
  async () => {
    const mutation = {
      bookingId:
        "booking-1",

      bookingCode:
        "NGB-TEST-001",

      currentBookingStatus:
        "Pending",

      currentPaymentStatus:
        "Pending",

      seatAction:
        "held-to-booked",

      nextBookingStatus:
        "Confirmed",

      nextPaymentStatus:
        "Paid",

      paymentReviewRequired:
        false,

      paymentReviewReason:
        null,

      paymentReviewAt:
        null,
    };

    const adapter =
      createHttpCallbackAdapter({
        endpoint:
          "https://example.test/api/internal/ipaymu/callback-lifecycle",

        token:
          "test-secret-token",

        fetchImpl:
          async (
            _url,
            options,
          ) => {
            const body =
              JSON.parse(
                options.body,
              );

            assert.equal(
              body.operation,
              "apply",
            );

            assert.deepEqual(
              body.mutation,
              mutation,
            );

            return Response.json({
              success: true,

              result: {
                duplicate: false,
                applied: true,
              },
            });
          },
      });

    const result =
      await adapter
        .applyLifecycleImpl(
          mutation,
        );

    assert.deepEqual(
      result,
      {
        duplicate: false,
        applied: true,
      },
    );
  },
);

test(
  "HTTP callback adapter preserves remote rejection code",
  async () => {
    const adapter =
      createHttpCallbackAdapter({
        endpoint:
          "https://example.test/api/internal/ipaymu/callback-lifecycle",

        token:
          "test-secret-token",

        fetchImpl:
          async () =>
            Response.json(
              {
                success: false,
                code:
                  "LIFECYCLE_PLAN_MISMATCH",
              },
              {
                status: 409,
              },
            ),
      });

    await assert.rejects(
      () =>
        adapter.applyLifecycleImpl({
          bookingId:
            "booking-1",
        }),

      error => {
        assert.ok(
          error instanceof
            HttpCallbackAdapterError,
        );

        assert.equal(
          error.code,
          "LIFECYCLE_PLAN_MISMATCH",
        );

        assert.equal(
          error.status,
          409,
        );

        return true;
      },
    );
  },
);

test(
  "HTTP callback adapter rejects partial HTTP configuration",
  () => {
    assert.throws(
      () =>
        createHttpCallbackAdapter({
          endpoint:
            "https://example.test/internal",

          token: "",
        }),
      TypeError,
    );
  },
);
