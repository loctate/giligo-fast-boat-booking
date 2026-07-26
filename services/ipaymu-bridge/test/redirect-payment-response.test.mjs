import assert from "node:assert/strict";
import test from "node:test";

import {
  IpaymuResponseError,
  parseRedirectPaymentResponse,
} from "../src/redirect-payment-response.mjs";

const successEnvelope = {
  Status: 200,
  Message: "Success",

  Data: {
    SessionID: 12345,

    Url:
      "https://sandbox.ipaymu.com/payment/test-session",
  },
};

test(
  "parses successful Redirect Payment response",
  () => {
    const result =
      parseRedirectPaymentResponse(
        successEnvelope,
      );

    assert.equal(
      result.status,
      200,
    );

    assert.equal(
      result.message,
      "Success",
    );

    assert.equal(
      result.sessionId,
      "12345",
    );

    assert.equal(
      result.paymentUrl,
      "https://sandbox.ipaymu.com/payment/test-session",
    );

    assert.equal(
      Object.hasOwn(
        result,
        "referenceId",
      ),
      false,
    );
  },
);

test(
  "rejects unsuccessful provider status",
  () => {
    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: 401,
          Message:
            "Unauthorized signature",
          Data: null,
        }),
      (error) => {
        assert.equal(
          error instanceof
            IpaymuResponseError,
          true,
        );

        assert.equal(
          error.status,
          401,
        );

        return true;
      },
    );
  },
);

test(
  "rejects missing SessionID",
  () => {
    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: 200,
          Message: "Success",

          Data: {
            Url:
              "https://sandbox.ipaymu.com/payment/test",
          },
        }),
      /Data\.SessionID/,
    );
  },
);

test(
  "rejects missing payment URL",
  () => {
    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: 200,
          Message: "Success",

          Data: {
            SessionID:
              "SESSION-001",
          },
        }),
      /Data\.Url/,
    );
  },
);

test(
  "rejects non-HTTPS payment URL",
  () => {
    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: 200,
          Message: "Success",

          Data: {
            SessionID:
              "SESSION-001",

            Url:
              "http://example.invalid/payment",
          },
        }),
      /HTTPS/,
    );
  },
);

test(
  "rejects malformed response envelope",
  () => {
    assert.throws(
      () =>
        parseRedirectPaymentResponse(
          null,
        ),
      /Response must be an object/,
    );

    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: "200",
          Message: "Success",
          Data: {},
        }),
      /Status must be an integer/,
    );

    assert.throws(
      () =>
        parseRedirectPaymentResponse({
          Status: 200,
          Message: "",
          Data: {},
        }),
      /Message/,
    );
  },
);
