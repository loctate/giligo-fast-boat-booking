function requireObject(value, name) {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw new TypeError(
      `${name} must be an object.`,
    );
  }

  return value;
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

function requireInteger(value, name) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed)) {
    throw new TypeError(
      `${name} must be an integer.`,
    );
  }

  return parsed;
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

export class IpaymuResponseError extends Error {
  constructor({
    status,
    message,
  }) {
    super(message);

    this.name = "IpaymuResponseError";
    this.status = status;
  }
}

export function parseRedirectPaymentResponse(
  rawResponse,
) {
  const envelope = requireObject(
    rawResponse,
    "response",
  );

  const status = requireInteger(
    envelope.Status,
    "Status",
  );

  if (typeof envelope.Success !== "boolean") {
    throw new TypeError(
      "Success must be a boolean.",
    );
  }

  const message = requireText(
    envelope.Message,
    "Message",
  );

  if (
    envelope.Success !== true
    || status < 200
    || status >= 300
  ) {
    throw new IpaymuResponseError({
      status,
      message,
    });
  }

  const data = requireObject(
    envelope.Data,
    "Data",
  );

  const transactionId = requireText(
    String(data.TransactionId ?? ""),
    "Data.TransactionId",
  );

  const referenceId = requireText(
    String(data.ReferenceId ?? ""),
    "Data.ReferenceId",
  );

  const paymentUrl = requireHttpsUrl(
    data.Url,
    "Data.Url",
  );

  return {
    status,
    success: true,
    message,
    transactionId,
    referenceId,
    paymentUrl,

    paymentMethod:
      data.Via === undefined
        ? null
        : String(data.Via),

    paymentChannel:
      data.Channel === undefined
        ? null
        : String(data.Channel),

    paymentNumber:
      data.PaymentNo === undefined
        ? null
        : String(data.PaymentNo),

    paymentName:
      data.PaymentName === undefined
        ? null
        : String(data.PaymentName),

    total:
      data.Total === undefined
        ? null
        : Number(data.Total),

    fee:
      data.Fee === undefined
        ? null
        : Number(data.Fee),

    expired:
      data.Expired === undefined
        ? null
        : String(data.Expired),
  };
}
