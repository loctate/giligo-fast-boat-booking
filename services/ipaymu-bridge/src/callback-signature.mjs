import {
  createHmac,
  timingSafeEqual,
} from "node:crypto";

const INTEGER_FIELDS = new Set([
  "trx_id",
  "status_code",
  "transaction_status_code",
  "paid_off",
]);

function parseInteger(value, field) {
  const text = String(value);

  if (!/^-?\d+$/.test(text)) {
    throw new TypeError(
      `${field} must contain an integer.`,
    );
  }

  const parsed = Number.parseInt(text, 10);

  if (!Number.isSafeInteger(parsed)) {
    throw new TypeError(
      `${field} exceeds the safe integer range.`,
    );
  }

  return parsed;
}

function parseEscrowBoolean(value) {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return true;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return false;
  }

  throw new TypeError(
    "is_escrow must be boolean-compatible.",
  );
}

export function normalizeCallbackPayload(rawPayload) {
  if (
    rawPayload === null ||
    typeof rawPayload !== "object" ||
    Array.isArray(rawPayload)
  ) {
    throw new TypeError(
      "Callback payload must be a plain object.",
    );
  }

  const normalized = {};

  for (const [key, value] of Object.entries(rawPayload)) {
    if (key === "signature") {
      continue;
    }

    if (value === null) {
      normalized[key] = null;
      continue;
    }

    if (INTEGER_FIELDS.has(key)) {
      normalized[key] = parseInteger(value, key);
      continue;
    }

    if (key === "is_escrow") {
      normalized[key] = parseEscrowBoolean(value);
      continue;
    }

    if (key === "additional_info") {
      normalized[key] =
        Array.isArray(value) ||
        (typeof value === "object" && value !== null)
          ? value
          : value === "[]" || value === ""
            ? []
            : String(value);

      continue;
    }

    normalized[key] =
      typeof value === "object"
        ? value
        : String(value);
  }

  if (!Object.hasOwn(normalized, "additional_info")) {
    normalized.additional_info = [];
  }

  return normalized;
}

export function serializeCallbackPayload(rawPayload) {
  const normalized =
    normalizeCallbackPayload(rawPayload);

  const sorted = Object.keys(normalized)
    .sort((left, right) => {
      if (left < right) return -1;
      if (left > right) return 1;
      return 0;
    })
    .reduce((result, key) => {
      result[key] = normalized[key];
      return result;
    }, {});

  return JSON.stringify(sorted).replace(/\//g, "\\/");
}

export function createCallbackSignature(
  rawPayload,
  vaSecret,
) {
  if (
    typeof vaSecret !== "string" ||
    vaSecret.length === 0
  ) {
    throw new TypeError(
      "vaSecret must be a non-empty string.",
    );
  }

  const serializedPayload =
    serializeCallbackPayload(rawPayload);

  const signature = createHmac(
    "sha256",
    vaSecret,
  )
    .update(serializedPayload, "utf8")
    .digest("hex");

  return {
    serializedPayload,
    signature,
  };
}

export function verifyCallbackSignature({
  rawPayload,
  receivedSignature,
  vaSecret,
}) {
  if (
    typeof receivedSignature !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(receivedSignature)
  ) {
    return false;
  }

  const expected = createCallbackSignature(
    rawPayload,
    vaSecret,
  ).signature;

  const expectedBuffer = Buffer.from(
    expected,
    "hex",
  );

  const receivedBuffer = Buffer.from(
    receivedSignature.toLowerCase(),
    "hex",
  );

  return (
    expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(
      expectedBuffer,
      receivedBuffer,
    )
  );
}
