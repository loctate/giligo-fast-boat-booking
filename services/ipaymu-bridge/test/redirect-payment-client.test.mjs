import assert from "node:assert/strict";
import test from "node:test";

import {
  IpaymuResponseError,
} from "../src/redirect-payment-response.mjs";

import {
  createRedirectPayment,
  IpaymuTransportError,
} from "../src/redirect-payment-client.mjs";

const config = {
  apiBaseUrl:
    "https://sandbox.ipaymu.com/api",
  va: "1179001234567890",
  apiKey: "test-api-key",
};

const payload = {
  product: [
    "Fast Boat Ticket",
  ],

  qty: [
    2,
  ],

  price: [
    450000,
  ],

  description: [
    "Sanur to Nusa Penida",
  ],

  returnUrl:
    "https://nusagiliboat.com/booking/NGB-TEST?payment=success",

  notifyUrl:
    "https://nusagiliboat.com/api/payments/ipaymu/callback",

  cancelUrl:
    "https://nusagiliboat.com/booking/NGB-TEST?payment=cancelled",

  referenceId:
    "NGB-TEST-001",
};

const successEnvelope = {
  Status: 200,
  Message: "Success",

  Data: {
    SessionID:
      "IPAYMU-SESSION-001",

    Url:
      "https://sandbox.ipaymu.com/payment/test-001",
  },
};

function jsonResponse(
  status,
  body,
) {
  return {
    status,

    text: async () =>
      typeof body === "string"
        ? body
        : JSON.stringify(body),
  };
}

test(
  "sends signed request through injected transport",
  async () => {
    const calls = [];

    const fakeFetch = async (
      url,
      options,
    ) => {
      calls.push({
        url,
        options,
      });

      return jsonResponse(
        200,
        successEnvelope,
      );
    };

    const result =
      await createRedirectPayment({
        config,
        payload,
        now: new Date(
          "2026-07-26T06:30:45.000Z",
        ),
        fetchImpl: fakeFetch,
      });

    assert.equal(calls.length, 1);

    assert.equal(
      calls[0].url,
      "https://sandbox.ipaymu.com/api/v2/payment",
    );

    assert.equal(
      calls[0].options.method,
      "POST",
    );

    assert.equal(
      calls[0].options.headers.va,
      config.va,
    );

    assert.equal(
      calls[0].options.headers.timestamp,
      "20260726063045",
    );

    assert.match(
      calls[0].options.headers.signature,
      /^[a-f0-9]{64}$/,
    );

    assert.equal(
      JSON.stringify(
        calls[0].options,
      ).includes(
        config.apiKey,
      ),
      false,
    );

    assert.equal(
      result.sessionId,
      "IPAYMU-SESSION-001",
    );

    assert.equal(
      result.referenceId,
      "NGB-TEST-001",
    );
  },
);

test(
  "preserves iPaymu API errors",
  async () => {
    const fakeFetch = async () =>
      jsonResponse(401, {
        Status: 401,
        Message:
          "unauthorized signature",
        Data: null,
      });

    await assert.rejects(
      () =>
        createRedirectPayment({
          config,
          payload,
          fetchImpl: fakeFetch,
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
  "rejects invalid JSON responses",
  async () => {
    const fakeFetch = async () =>
      jsonResponse(
        502,
        "<html>Bad Gateway</html>",
      );

    await assert.rejects(
      () =>
        createRedirectPayment({
          config,
          payload,
          fetchImpl: fakeFetch,
        }),
      (error) => {
        assert.equal(
          error instanceof
            IpaymuTransportError,
          true,
        );

        assert.equal(
          error.code,
          "INVALID_JSON",
        );

        assert.equal(
          error.status,
          502,
        );

        return true;
      },
    );
  },
);

test(
  "wraps transport failures",
  async () => {
    const fakeFetch = async () => {
      throw new Error(
        "connection refused",
      );
    };

    await assert.rejects(
      () =>
        createRedirectPayment({
          config,
          payload,
          fetchImpl: fakeFetch,
        }),
      (error) => {
        assert.equal(
          error instanceof
            IpaymuTransportError,
          true,
        );

        assert.equal(
          error.code,
          "NETWORK_ERROR",
        );

        return true;
      },
    );
  },
);

test(
  "aborts requests after timeout",
  async () => {
    const fakeFetch = async (
      _url,
      options,
    ) => new Promise(
      (_resolve, reject) => {
        options.signal.addEventListener(
          "abort",
          () => reject(
            new Error("aborted"),
          ),
          {
            once: true,
          },
        );
      },
    );

    await assert.rejects(
      () =>
        createRedirectPayment({
          config,
          payload,
          fetchImpl: fakeFetch,
          timeoutMs: 20,
        }),
      (error) => {
        assert.equal(
          error instanceof
            IpaymuTransportError,
          true,
        );

        assert.equal(
          error.code,
          "TIMEOUT",
        );

        return true;
      },
    );
  },
);

test(
  "rejects invalid timeout configuration",
  async () => {
    await assert.rejects(
      () =>
        createRedirectPayment({
          config,
          payload,
          fetchImpl:
            async () =>
              jsonResponse(
                200,
                successEnvelope,
              ),
          timeoutMs: 0,
        }),
      /positive integer/,
    );
  },
);
