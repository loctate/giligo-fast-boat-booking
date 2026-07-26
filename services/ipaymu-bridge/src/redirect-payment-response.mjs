export class IpaymuResponseError extends Error {
  constructor({
    status,
    message,
    providerData = null,
  }) {
    super(message);

    this.name = "IpaymuResponseError";
    this.status = status;
    this.providerData = providerData;
  }
}

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

function requireStatus(value) {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(
      "Status must be an integer.",
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

function requireHttpsUrl(value, name) {
  const text = requireText(
    value,
    name,
  );

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

export function parseRedirectPaymentResponse(
  rawResponse,
) {
  const envelope = requireObject(
    rawResponse,
    "Response",
  );

  const status = requireStatus(
    envelope.Status,
  );

  const message = requireText(
    String(envelope.Message ?? ""),
    "Message",
  );

  if (status !== 200) {
    throw new IpaymuResponseError({
      status,
      message,
      providerData:
        envelope.Data ?? null,
    });
  }

  const data = requireObject(
    envelope.Data,
    "Data",
  );

  const sessionId = requireText(
    String(data.SessionID ?? ""),
    "Data.SessionID",
  );

  const paymentUrl = requireHttpsUrl(
    data.Url,
    "Data.Url",
  );

  return {
    status,
    message,
    sessionId,
    paymentUrl,
  };
}
