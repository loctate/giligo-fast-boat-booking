import assert from "node:assert/strict";
import test from "node:test";

import {
  IpaymuResponseError,
  parseRedirectPaymentResponse,
} from "../src/redirect-payment-response.mjs";

const successResponse = {
  Status: 200,
  Success: true,
  Message: "Success",
  Data: {
    TransactionId: 12345,
    ReferenceId: "NGB-TEST-001",
    Via: "va",
    Channel: "bca",
    PaymentNo: "1234567890",
    PaymentName: "BCA Virtual Account",
    Total: 900000,
    Fee: 0,
    Expired: "2026-07-27 13:00:00",
    Url:
      "https://sandbox.ipaymu.com/payment/12345",
  },
};

test(
  "parses successful Redirect Payment response",
  () => {
    const result =
      parseRedirectPaymentResponse(
        successResponse,
      );

    assert.equal(result.status, 200);
    assert.equal(result.success, true);

    assert.equal(
      result.transactionId,
      "12345",
    );

    assert.equal(
      result.referenceId,
      "NGB-TEST-001",
    );

    assert.equal(
      result.paymentUrl,
      "https://sandbox.ipaymu.com/payment/12345",
    );

    assert.equal(result.total, 900000);
    assert.equal(result.fee, 0);
  },
);

test(
  "rejects unsuccessful API response",
  () => {
    assert.throws(
      () => parseRedirectPaymentResponse({
        Status: 400,
        Success: false,
        Message: "Invalid request",
        Data: null,
      }),
      (error) => {
        assert.equal(
          error instanceof IpaymuResponseError,
          true,
        );

        assert.equal(error.status, 400);
        assert.equal(
          error.message,
          "Invalid request",
        );

        return true;
      },
    );
  },
);

test(
  "rejects missing payment URL",
  () => {
    assert.throws(
      () => parseRedirectPaymentResponse({
        ...successResponse,
        Data: {
          ...successResponse.Data,
          Url: "",
        },
      }),
      /Data.Url/,
    );
  },
);

test(
  "rejects non-HTTPS payment URL",
  () => {
    assert.throws(
      () => parseRedirectPaymentResponse({
        ...successResponse,
        Data: {
          ...successResponse.Data,
          Url:
            "http://example.invalid/payment",
        },
      }),
      /must use HTTPS/,
    );
  },
);

test(
  "rejects malformed response envelope",
  () => {
    assert.throws(
      () => parseRedirectPaymentResponse(null),
      /response must be an object/,
    );

    assert.throws(
      () => parseRedirectPaymentResponse({
        Status: "invalid",
        Success: true,
        Message: "Success",
        Data: {},
      }),
      /Status must be an integer/,
    );
  },
);
