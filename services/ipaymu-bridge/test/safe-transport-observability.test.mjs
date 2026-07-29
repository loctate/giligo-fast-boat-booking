
import assert from "node:assert/strict";
import test from "node:test";

import {
  IpaymuTransportError,
} from "../src/redirect-payment-client.mjs";

import {
  buildSafeTransportDiagnostic,
  emitSafeTransportDiagnostic,
  inferIpaymuTransportStage,
} from "../src/safe-transport-observability.mjs";

const providerApiBaseUrl =
  "https://sandbox.ipaymu.com/api";

test(
  "infers safe transport stages",
  () => {
    assert.equal(
      inferIpaymuTransportStage(
        "NETWORK_ERROR",
      ),
      "fetch",
    );

    assert.equal(
      inferIpaymuTransportStage(
        "INVALID_JSON",
      ),
      "parse_json",
    );

    assert.equal(
      inferIpaymuTransportStage(
        "HTTP_ERROR",
      ),
      "http_status",
    );

    assert.equal(
      inferIpaymuTransportStage(
        "UNRECOGNIZED",
      ),
      "unknown",
    );
  },
);

test(
  "builds safe DNS diagnostic without messages or secrets",
  () => {
    const cause =
      Object.assign(
        new Error(
          "getaddrinfo includes sensitive host detail",
        ),
        {
          code: "EAI_AGAIN",
        },
      );

    const error =
      new IpaymuTransportError({
        code: "NETWORK_ERROR",
        message:
          "private transport message",
        cause,
      });

    const diagnostic =
      buildSafeTransportDiagnostic({
        error,
        providerApiBaseUrl,
      });

    assert.deepEqual(
      diagnostic,
      {
        event:
          "ipaymu_transport_failure",
        stage: "fetch",
        transportCode:
          "NETWORK_ERROR",
        httpStatus: null,
        errorName:
          "IpaymuTransportError",
        causeName: "Error",
        causeCode: "EAI_AGAIN",
        aborted: false,
        requestMethod: "POST",
        providerHost:
          "sandbox.ipaymu.com",
        providerPath:
          "/api/v2/payment",
      },
    );

    const serialized =
      JSON.stringify(diagnostic);

    for (const forbidden of [
      "private transport message",
      "getaddrinfo includes",
      "apiKey",
      "signature",
      "buyerEmail",
      "paymentUrl",
      "sessionId",
      "referenceId",
    ]) {
      assert.equal(
        serialized.includes(forbidden),
        false,
      );
    }
  },
);

test(
  "distinguishes redirect rejection internally",
  () => {
    const nested =
      new Error(
        "unexpected redirect",
      );

    const cause =
      new TypeError(
        "fetch failed",
        {
          cause: nested,
        },
      );

    const error =
      new IpaymuTransportError({
        code: "NETWORK_ERROR",
        message:
          "Unable to connect to iPaymu.",
        cause,
      });

    const diagnostic =
      buildSafeTransportDiagnostic({
        error,
        providerApiBaseUrl,
      });

    assert.equal(
      diagnostic.stage,
      "fetch",
    );

    assert.equal(
      diagnostic.causeName,
      "Error",
    );

    assert.equal(
      diagnostic.causeCode,
      "REDIRECT_REJECTED",
    );

    assert.equal(
      JSON.stringify(
        diagnostic,
      ).includes(
        "unexpected redirect",
      ),
      false,
    );
  },
);

test(
  "preserves timeout and HTTP status metadata safely",
  () => {
    const timeout =
      new IpaymuTransportError({
        code: "TIMEOUT",
        message: "private timeout",
        cause:
          Object.assign(
            new Error("private abort"),
            {
              name: "AbortError",
              code: "ABORT_ERR",
            },
          ),
      });

    const timeoutDiagnostic =
      buildSafeTransportDiagnostic({
        error: timeout,
        providerApiBaseUrl,
      });

    assert.equal(
      timeoutDiagnostic.stage,
      "fetch",
    );

    assert.equal(
      timeoutDiagnostic.aborted,
      true,
    );

    assert.equal(
      timeoutDiagnostic.causeCode,
      "ABORT_ERR",
    );

    const httpError =
      new IpaymuTransportError({
        code: "HTTP_ERROR",
        message:
          "private HTTP response",
        status: 401,
      });

    const httpDiagnostic =
      buildSafeTransportDiagnostic({
        error: httpError,
        providerApiBaseUrl,
      });

    assert.equal(
      httpDiagnostic.stage,
      "http_status",
    );

    assert.equal(
      httpDiagnostic.httpStatus,
      401,
    );
  },
);

test(
  "emits through injected logger and suppresses logger failure",
  () => {
    const events = [];

    const emitted =
      emitSafeTransportDiagnostic({
        logger:
          (diagnostic) => {
            events.push(diagnostic);
          },
        diagnostic: {
          event:
            "ipaymu_transport_failure",
        },
      });

    assert.equal(emitted, true);
    assert.equal(events.length, 1);

    const suppressed =
      emitSafeTransportDiagnostic({
        logger: () => {
          throw new Error(
            "logger failure",
          );
        },
        diagnostic: {
          event:
            "ipaymu_transport_failure",
        },
      });

    assert.equal(suppressed, false);

    assert.equal(
      emitSafeTransportDiagnostic({
        logger: undefined,
        diagnostic: {},
      }),
      false,
    );
  },
);
