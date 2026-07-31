import assert from "node:assert/strict";
import test from "node:test";

import {
  createRequestCorrelationId,
  logSafeAuthRejectionDiagnostic,
} from "../src/safe-auth-rejection-observability.mjs";

const uuidV4Pattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

test(
  "request correlation IDs are unique UUID v4 values",
  () => {
    const requestIds =
      Array.from(
        {
          length: 100,
        },
        () =>
          createRequestCorrelationId(),
      );

    for (const requestId of requestIds) {
      assert.match(
        requestId,
        uuidV4Pattern,
      );
    }

    assert.equal(
      new Set(requestIds).size,
      requestIds.length,
    );
  },
);

test(
  "safe logger accepts only exact route and code pairs",
  () => {
    const requestId =
      createRequestCorrelationId();

    const originalWrite =
      process.stderr.write;

    const captured = [];

    try {
      process.stderr.write =
        (chunk) => {
          captured.push(
            String(chunk),
          );

          return true;
        };

      const validCases = [
        {
          requestId,
          route:
            "transactions",
          statusCode:
            401,
          code:
            "UNAUTHORIZED",
        },
        {
          requestId,
          route:
            "callback",
          statusCode:
            401,
          code:
            "INVALID_CALLBACK_SIGNATURE",
        },
      ];

      for (const validCase of validCases) {
        assert.equal(
          logSafeAuthRejectionDiagnostic(
            validCase,
          ),
          true,
        );
      }

      assert.equal(
        captured.length,
        2,
      );

      const diagnostics =
        captured.map((line) =>
          JSON.parse(line)
        );

      assert.deepEqual(
        diagnostics.map(
          ({
            route,
            code,
          }) => ({
            route,
            code,
          }),
        ),
        [
          {
            route:
              "transactions",
            code:
              "UNAUTHORIZED",
          },
          {
            route:
              "callback",
            code:
              "INVALID_CALLBACK_SIGNATURE",
          },
        ],
      );

      for (const diagnostic of diagnostics) {
        assert.deepEqual(
          Object.keys(diagnostic),
          [
            "event",
            "requestId",
            "route",
            "statusCode",
            "code",
          ],
        );

        assert.equal(
          diagnostic.event,
          "ipaymu_auth_rejection",
        );

        assert.equal(
          diagnostic.requestId,
          requestId,
        );

        assert.equal(
          diagnostic.statusCode,
          401,
        );
      }

      const beforeInvalid =
        captured.length;

      const invalidCases = [
        {
          requestId,
          route:
            "transactions",
          statusCode:
            401,
          code:
            "INVALID_CALLBACK_SIGNATURE",
        },
        {
          requestId,
          route:
            "callback",
          statusCode:
            401,
          code:
            "UNAUTHORIZED",
        },
        {
          requestId,
          route:
            "unknown",
          statusCode:
            401,
          code:
            "UNAUTHORIZED",
        },
        {
          requestId:
            "not-a-uuid",
          route:
            "transactions",
          statusCode:
            401,
          code:
            "UNAUTHORIZED",
        },
        {
          requestId,
          route:
            "transactions",
          statusCode:
            200,
          code:
            "UNAUTHORIZED",
        },
        {
          requestId,
          route:
            "transactions",
          statusCode:
            401,
          code:
            "UNKNOWN_CODE",
        },
      ];

      for (const invalidCase of invalidCases) {
        assert.equal(
          logSafeAuthRejectionDiagnostic(
            invalidCase,
          ),
          false,
        );
      }

      assert.equal(
        captured.length,
        beforeInvalid,
      );
    } finally {
      process.stderr.write =
        originalWrite;
    }
  },
);

test(
  "safe logger contains write failures",
  () => {
    const requestId =
      createRequestCorrelationId();

    const originalWrite =
      process.stderr.write;

    try {
      process.stderr.write = () => {
        throw new Error(
          "simulated stderr failure",
        );
      };

      assert.equal(
        logSafeAuthRejectionDiagnostic({
          requestId,
          route:
            "callback",
          statusCode:
            401,
          code:
            "INVALID_CALLBACK_SIGNATURE",
        }),
        false,
      );
    } finally {
      process.stderr.write =
        originalWrite;
    }
  },
);
