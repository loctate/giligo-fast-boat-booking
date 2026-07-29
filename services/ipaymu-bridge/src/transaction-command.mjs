import {
  timingSafeEqual,
} from "node:crypto";

import {
  getReadiness,
} from "./config.mjs";

import {
  IpaymuResponseError,
} from "./redirect-payment-response.mjs";

import {
  IpaymuTransportError,
} from "./redirect-payment-client.mjs";

import {
  buildSafeTransportDiagnostic,
  emitSafeTransportDiagnostic,
} from "./safe-transport-observability.mjs";

const MAX_BODY_BYTES = 64 * 1024;

function response(statusCode, body) {
  return {
    statusCode,
    body,
  };
}

function readHeader(headers, name) {
  if (
    headers === null
    || typeof headers !== "object"
  ) {
    return "";
  }

  const target = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === target) {
      return Array.isArray(value)
        ? String(value[0] || "")
        : String(value || "");
    }
  }

  return "";
}

function readBearerToken(headers) {
  const authorization =
    readHeader(headers, "authorization");

  const match = authorization.match(
    /^Bearer[ \t]+(.+)$/i,
  );

  return match
    ? match[1].trim()
    : "";
}

function secureEqual(left, right) {
  if (
    typeof left !== "string"
    || typeof right !== "string"
    || left.length === 0
    || right.length === 0
  ) {
    return false;
  }

  const leftBuffer =
    Buffer.from(left, "utf8");

  const rightBuffer =
    Buffer.from(right, "utf8");

  return (
    leftBuffer.length === rightBuffer.length
    && timingSafeEqual(
      leftBuffer,
      rightBuffer,
    )
  );
}

function parseJsonBody(rawBody) {
  if (typeof rawBody !== "string") {
    throw new TypeError(
      "Request body must be a string.",
    );
  }

  if (
    Buffer.byteLength(rawBody, "utf8")
      > MAX_BODY_BYTES
  ) {
    const error = new Error(
      "Request body exceeds 64 KiB.",
    );

    error.code = "BODY_TOO_LARGE";
    throw error;
  }

  if (rawBody.trim().length === 0) {
    throw new TypeError(
      "Request body cannot be empty.",
    );
  }

  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new TypeError(
      "Request body must contain valid JSON.",
    );
  }

  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
  ) {
    throw new TypeError(
      "Request body must contain a JSON object.",
    );
  }

  return parsed;
}

export async function handleTransactionCommand({
  config,
  headers = {},
  rawBody = "",
  createPaymentImpl,
  transportDiagnosticLogger,
}) {
  const readiness = getReadiness(config);

  if (!readiness.ready) {
    return response(503, {
      ok: false,
      code: "IPAYMU_BRIDGE_DISABLED",
    });
  }

  const suppliedToken =
    readBearerToken(headers);

  if (
    !secureEqual(
      suppliedToken,
      config.internalToken,
    )
  ) {
    return response(401, {
      ok: false,
      code: "UNAUTHORIZED",
    });
  }

  const contentType =
    readHeader(headers, "content-type")
      .split(";", 1)[0]
      .trim()
      .toLowerCase();

  if (contentType !== "application/json") {
    return response(415, {
      ok: false,
      code: "UNSUPPORTED_MEDIA_TYPE",
    });
  }

  if (typeof createPaymentImpl !== "function") {
    return response(501, {
      ok: false,
      code:
        "TRANSACTION_CREATION_NOT_CONNECTED",
    });
  }

  try {
    const payload =
      parseJsonBody(rawBody);

    const payment =
      await createPaymentImpl({
        config,
        payload,
      });

    return response(201, {
      ok: true,
      code: "PAYMENT_SESSION_CREATED",

      payment: {
        sessionId:
          payment.sessionId,

        referenceId:
          payment.referenceId,

        paymentUrl:
          payment.paymentUrl,
      },
    });
  } catch (error) {
    if (error?.code === "BODY_TOO_LARGE") {
      return response(413, {
        ok: false,
        code: "PAYLOAD_TOO_LARGE",
      });
    }

    if (error instanceof TypeError) {
      return response(400, {
        ok: false,
        code: "INVALID_REQUEST",
        message: error.message,
      });
    }

    if (
      error instanceof
        IpaymuResponseError
    ) {
      return response(502, {
        ok: false,
        code: "IPAYMU_API_ERROR",
        providerStatus:
          error.status,
      });
    }

    if (
      error instanceof
        IpaymuTransportError
    ) {
      const diagnostic =
        buildSafeTransportDiagnostic({
          error,
          providerApiBaseUrl:
            config.apiBaseUrl,
        });

      emitSafeTransportDiagnostic({
        logger:
          transportDiagnosticLogger,
        diagnostic,
      });

      return response(
        error.code === "TIMEOUT"
          ? 504
          : 502,
        {
          ok: false,
          code:
            error.code === "TIMEOUT"
              ? "IPAYMU_TIMEOUT"
              : "IPAYMU_TRANSPORT_ERROR",
        },
      );
    }

    return response(500, {
      ok: false,
      code: "INTERNAL_ERROR",
    });
  }
}
