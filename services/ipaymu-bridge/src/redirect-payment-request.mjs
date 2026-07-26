import {
  createRequestSignature,
} from "./request-signature.mjs";

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

function requireHttpsUrl(value, name) {
  const text = requireText(value, name);
  let parsed;

  try {
    parsed = new URL(text);
  } catch {
    throw new TypeError(
      `${name} must be a valid URL.`,
    );
  }

  if (parsed.protocol !== "https:") {
    throw new TypeError(
      `${name} must use HTTPS.`,
    );
  }

  return parsed.toString();
}

function normalizeTextArray(value, name) {
  if (
    !Array.isArray(value)
    || value.length === 0
  ) {
    throw new TypeError(
      `${name} must be a non-empty array.`,
    );
  }

  return value.map(
    (item, index) => requireText(
      item,
      `${name}[${index}]`,
    ),
  );
}

function normalizePositiveIntegerArray(
  value,
  name,
) {
  if (
    !Array.isArray(value)
    || value.length === 0
  ) {
    throw new TypeError(
      `${name} must be a non-empty array.`,
    );
  }

  return value.map((item, index) => {
    const parsed = Number(item);

    if (
      !Number.isSafeInteger(parsed)
      || parsed <= 0
    ) {
      throw new TypeError(
        `${name}[${index}] must be a positive integer.`,
      );
    }

    return String(parsed);
  });
}

function requireMatchingLengths(groups) {
  const lengths = groups.map(
    ([, value]) => value.length,
  );

  if (
    !lengths.every(
      (length) => length === lengths[0],
    )
  ) {
    const summary = groups
      .map(
        ([name, value]) =>
          `${name}=${value.length}`,
      )
      .join(", ");

    throw new TypeError(
      `Payment item arrays must have matching lengths: ${summary}.`,
    );
  }
}

function normalizeApiBaseUrl(value) {
  const text = requireHttpsUrl(
    value,
    "config.apiBaseUrl",
  );

  return text.endsWith("/")
    ? text
    : `${text}/`;
}

export function formatIpaymuTimestamp(
  date = new Date(),
) {
  if (
    !(date instanceof Date)
    || Number.isNaN(date.getTime())
  ) {
    throw new TypeError(
      "date must be a valid Date.",
    );
  }

  return date
    .toISOString()
    .replace(/\D/g, "")
    .slice(0, 14);
}

export function buildRedirectPaymentRequest({
  config,
  payload,
  now = new Date(),
}) {
  if (
    config === null
    || typeof config !== "object"
  ) {
    throw new TypeError(
      "config must be an object.",
    );
  }

  if (
    payload === null
    || typeof payload !== "object"
  ) {
    throw new TypeError(
      "payload must be an object.",
    );
  }

  const apiBaseUrl =
    normalizeApiBaseUrl(
      config.apiBaseUrl,
    );

  const va = requireText(
    config.va,
    "config.va",
  );

  const apiKey = requireText(
    config.apiKey,
    "config.apiKey",
  );

  const product = normalizeTextArray(
    payload.product,
    "product",
  );

  const qty =
    normalizePositiveIntegerArray(
      payload.qty,
      "qty",
    );

  const price =
    normalizePositiveIntegerArray(
      payload.price,
      "price",
    );

  const description =
    normalizeTextArray(
      payload.description,
      "description",
    );

  requireMatchingLengths([
    ["product", product],
    ["qty", qty],
    ["price", price],
    ["description", description],
  ]);

  const requestPayload = {
    product,
    qty,
    price,
    description,

    returnUrl: requireHttpsUrl(
      payload.returnUrl,
      "returnUrl",
    ),

    notifyUrl: requireHttpsUrl(
      payload.notifyUrl,
      "notifyUrl",
    ),

    cancelUrl: requireHttpsUrl(
      payload.cancelUrl,
      "cancelUrl",
    ),

    referenceId: requireText(
      payload.referenceId,
      "referenceId",
    ),
  };

  if (payload.buyerName !== undefined) {
    requestPayload.buyerName =
      requireText(
        payload.buyerName,
        "buyerName",
      );
  }

  if (payload.buyerEmail !== undefined) {
    requestPayload.buyerEmail =
      requireText(
        payload.buyerEmail,
        "buyerEmail",
      );
  }

  if (payload.buyerPhone !== undefined) {
    requestPayload.buyerPhone =
      requireText(
        payload.buyerPhone,
        "buyerPhone",
      );
  }

  if (payload.expired !== undefined) {
    const expired = Number(
      payload.expired,
    );

    if (
      !Number.isSafeInteger(expired)
      || expired <= 0
    ) {
      throw new TypeError(
        "expired must be a positive integer.",
      );
    }

    requestPayload.expired = expired;
  }

  if (
    payload.paymentMethod !== undefined
  ) {
    requestPayload.paymentMethod =
      requireText(
        payload.paymentMethod,
        "paymentMethod",
      );
  }

  const body = JSON.stringify(
    requestPayload,
  );

  const timestamp =
    formatIpaymuTimestamp(now);

  const signatureResult =
    createRequestSignature({
      method: "POST",
      va,
      apiKey,
      requestBody: body,
    });

  const url = new URL(
    "v2/payment",
    apiBaseUrl,
  ).toString();

  return {
    method: "POST",
    url,

    headers: {
      "Content-Type":
        "application/json",
      va,
      signature:
        signatureResult.signature,
      timestamp,
    },

    body,
  };
}
