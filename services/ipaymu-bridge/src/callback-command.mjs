import {
  getReadiness,
} from "./config.mjs";

import {
  normalizeCallbackPayload,
  verifyCallbackSignature,
} from "./callback-signature.mjs";

const JSON_CONTENT_TYPE =
  "application/json";

const FORM_CONTENT_TYPE =
  "application/x-www-form-urlencoded";

function getHeader(headers, name) {
  if (!headers) {
    return "";
  }

  if (typeof headers.get === "function") {
    return String(
      headers.get(name) ?? "",
    ).trim();
  }

  const expected =
    name.toLowerCase();

  for (
    const [key, value]
    of Object.entries(headers)
  ) {
    if (
      key.toLowerCase()
      !== expected
    ) {
      continue;
    }

    const selected =
      Array.isArray(value)
        ? value[0]
        : value;

    return String(
      selected ?? "",
    ).trim();
  }

  return "";
}

function getContentType(headers) {
  return getHeader(
    headers,
    "content-type",
  )
    .split(";", 1)[0]
    .trim()
    .toLowerCase();
}

function parseJsonBody(rawBody) {
  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    throw new TypeError(
      "Callback JSON body is malformed.",
    );
  }

  if (
    parsed === null
    || typeof parsed !== "object"
    || Array.isArray(parsed)
  ) {
    throw new TypeError(
      "Callback JSON body must be an object.",
    );
  }

  return parsed;
}

function parseFormBody(rawBody) {
  const params =
    new URLSearchParams(rawBody);

  const parsed = {};

  for (const [key, value] of params) {
    if (Object.hasOwn(parsed, key)) {
      throw new TypeError(
        `Duplicate callback field: ${key}.`,
      );
    }

    parsed[key] = value;
  }

  return parsed;
}

function parseCallbackBody({
  contentType,
  rawBody,
}) {
  if (contentType === JSON_CONTENT_TYPE) {
    return parseJsonBody(rawBody);
  }

  if (contentType === FORM_CONTENT_TYPE) {
    return parseFormBody(rawBody);
  }

  return null;
}

function requireText(value, name) {
  if (
    typeof value !== "string"
    || value.trim().length === 0
  ) {
    throw new TypeError(
      `${name} must be a non-empty string.`,
    );
  }

  return value.trim();
}

function optionalHeader(
  headers,
  name,
) {
  const value = getHeader(
    headers,
    name,
  );

  if (!value) {
    return null;
  }

  if (value.length > 200) {
    throw new TypeError(
      `${name} is too long.`,
    );
  }

  return value;
}

function mapPaymentState(statusCode) {
  if (statusCode === 1) {
    return "success";
  }

  if (statusCode === 0) {
    return "pending";
  }

  if (statusCode === -2) {
    return "expired";
  }

  return "unknown";
}

function buildCallbackEvent({
  normalizedPayload,
  headers,
}) {
  const trxId =
    normalizedPayload.trx_id;

  const statusCode =
    normalizedPayload.status_code;

  const transactionStatusCode =
    normalizedPayload
      .transaction_status_code;

  if (!Number.isSafeInteger(trxId)) {
    throw new TypeError(
      "trx_id must be a safe integer.",
    );
  }

  if (!Number.isSafeInteger(statusCode)) {
    throw new TypeError(
      "status_code must be a safe integer.",
    );
  }

  if (
    !Number.isSafeInteger(
      transactionStatusCode,
    )
  ) {
    throw new TypeError(
      "transaction_status_code must be a safe integer.",
    );
  }

  const referenceId =
    requireText(
      String(
        normalizedPayload.reference_id
        ?? normalizedPayload.referenceId
        ?? "",
      ),
      "reference_id",
    );

  const sessionId =
    normalizedPayload.sid == null
      ? null
      : requireText(
          String(normalizedPayload.sid),
          "sid",
        );

  const externalId =
    optionalHeader(
      headers,
      "x-external-id",
    );

  const timestamp =
    optionalHeader(
      headers,
      "x-timestamp",
    );

  const idempotencyKey =
    externalId
      ? `external:${externalId}`
      : [
          "ipaymu",
          referenceId,
          trxId,
          statusCode,
          transactionStatusCode,
        ].join(":");

  return {
    idempotencyKey,
    externalId,
    timestamp,

    paymentState:
      mapPaymentState(statusCode),

    trxId,
    sessionId,
    referenceId,
    statusCode,
    transactionStatusCode,

    paidOff:
      normalizedPayload.paid_off
      ?? null,

    providerStatus:
      normalizedPayload.status
      == null
        ? null
        : String(
            normalizedPayload.status,
          ),
  };
}

function response(
  statusCode,
  body,
) {
  return {
    statusCode,
    body,
  };
}

export async function handleCallbackCommand({
  config,
  headers,
  rawBody,
  processCallbackImpl,
} = {}) {
  if (
    config === null
    || typeof config !== "object"
    || Array.isArray(config)
  ) {
    return response(503, {
      ok: false,
      code:
        "IPAYMU_BRIDGE_DISABLED",
    });
  }

  const readiness =
    getReadiness(config);

  if (!readiness.ready) {
    return response(503, {
      ok: false,
      code:
        "IPAYMU_BRIDGE_DISABLED",
    });
  }

  const contentType =
    getContentType(headers);

  if (
    contentType !== JSON_CONTENT_TYPE
    && contentType !== FORM_CONTENT_TYPE
  ) {
    return response(415, {
      ok: false,
      code:
        "UNSUPPORTED_CALLBACK_CONTENT_TYPE",
    });
  }

  if (typeof rawBody !== "string") {
    return response(400, {
      ok: false,
      code:
        "INVALID_CALLBACK_BODY",
    });
  }

  let rawPayload;

  try {
    rawPayload =
      parseCallbackBody({
        contentType,
        rawBody,
      });
  } catch {
    return response(400, {
      ok: false,
      code:
        "INVALID_CALLBACK_BODY",
    });
  }

  let normalizedPayload;

  try {
    normalizedPayload =
      normalizeCallbackPayload(
        rawPayload,
      );
  } catch {
    return response(422, {
      ok: false,
      code:
        "INVALID_CALLBACK_PAYLOAD",
    });
  }

  const receivedSignature =
    getHeader(
      headers,
      "x-signature",
    );

  let signatureValid = false;

  try {
    signatureValid =
      verifyCallbackSignature({
        rawPayload,
        receivedSignature,
        vaSecret: config.va,
      });
  } catch {
    signatureValid = false;
  }

  if (!signatureValid) {
    return response(401, {
      ok: false,
      code:
        "INVALID_CALLBACK_SIGNATURE",
    });
  }

  let event;

  try {
    event =
      buildCallbackEvent({
        normalizedPayload,
        headers,
      });
  } catch {
    return response(422, {
      ok: false,
      code:
        "INVALID_CALLBACK_PAYLOAD",
    });
  }

  if (
    typeof processCallbackImpl
    !== "function"
  ) {
    return response(501, {
      ok: false,
      code:
        "CALLBACK_PROCESSING_NOT_CONNECTED",
    });
  }

  let processingResult;

  try {
    processingResult =
      await processCallbackImpl(event);
  } catch {
    return response(503, {
      ok: false,
      code:
        "CALLBACK_PROCESSING_FAILED",
    });
  }

  return response(200, {
    ok: true,
    accepted: true,

    duplicate:
      Boolean(
        processingResult?.duplicate,
      ),

    callback: {
      idempotencyKey:
        event.idempotencyKey,

      externalId:
        event.externalId,

      timestamp:
        event.timestamp,

      paymentState:
        event.paymentState,

      trxId:
        event.trxId,

      sessionId:
        event.sessionId,

      referenceId:
        event.referenceId,

      statusCode:
        event.statusCode,

      transactionStatusCode:
        event.transactionStatusCode,
    },
  });
}
