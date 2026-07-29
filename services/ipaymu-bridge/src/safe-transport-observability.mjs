
const SAFE_CODE_PATTERN =
  /^[A-Z0-9_]{1,80}$/;

const SAFE_NAME_PATTERN =
  /^[A-Za-z0-9_$.-]{1,80}$/;

const SAFE_STAGES = new Set([
  "fetch",
  "http_status",
  "parse_envelope",
  "parse_json",
  "read_body",
  "read_response",
  "unknown",
]);

const STAGE_BY_CODE = Object.freeze({
  INVALID_HTTP_RESPONSE:
    "read_response",
  EMPTY_RESPONSE:
    "read_body",
  INVALID_JSON:
    "parse_json",
  INVALID_API_RESPONSE:
    "parse_envelope",
  HTTP_ERROR:
    "http_status",
  TIMEOUT:
    "fetch",
  NETWORK_ERROR:
    "fetch",
});

function safeCode(value) {
  if (
    typeof value !== "string"
    || !SAFE_CODE_PATTERN.test(value)
  ) {
    return "UNKNOWN";
  }

  return value;
}

function safeName(value) {
  if (
    typeof value !== "string"
    || !SAFE_NAME_PATTERN.test(value)
  ) {
    return "UnknownError";
  }

  return value;
}

function safeStage(value) {
  return SAFE_STAGES.has(value)
    ? value
    : "unknown";
}

function readCause(error) {
  const direct =
    error?.cause;

  const nested =
    direct?.cause;

  if (
    nested
    && typeof nested === "object"
  ) {
    return nested;
  }

  if (
    direct
    && typeof direct === "object"
  ) {
    return direct;
  }

  return null;
}

function classifyCauseCode(error) {
  const direct =
    error?.cause;

  const nested =
    direct?.cause;

  const internalMessage =
    String(
      nested?.message
      ?? direct?.message
      ?? "",
    );

  if (
    internalMessage
    === "unexpected redirect"
  ) {
    return "REDIRECT_REJECTED";
  }

  return safeCode(
    nested?.code
    ?? direct?.code,
  );
}

function safeProviderEndpoint(
  providerApiBaseUrl,
) {
  try {
    const base =
      new URL(providerApiBaseUrl);

    if (
      !base.pathname.endsWith("/")
    ) {
      base.pathname += "/";
    }

    const endpoint =
      new URL(
        "v2/payment",
        base,
      );

    return {
      host:
        endpoint.hostname
        || "unknown",
      path:
        endpoint.pathname
        || "/api/v2/payment",
    };
  } catch {
    return {
      host: "unknown",
      path: "/api/v2/payment",
    };
  }
}

export function inferIpaymuTransportStage(
  code,
) {
  return STAGE_BY_CODE[code]
    || "unknown";
}

export function buildSafeTransportDiagnostic({
  error,
  providerApiBaseUrl,
}) {
  const cause =
    readCause(error);

  const endpoint =
    safeProviderEndpoint(
      providerApiBaseUrl,
    );

  const stage =
    safeStage(
      error?.stage
      ?? inferIpaymuTransportStage(
        error?.code,
      ),
    );

  return Object.freeze({
    event:
      "ipaymu_transport_failure",
    stage,
    transportCode:
      safeCode(error?.code),
    httpStatus:
      Number.isSafeInteger(
        error?.status,
      )
        ? error.status
        : null,
    errorName:
      safeName(error?.name),
    causeName:
      safeName(cause?.name),
    causeCode:
      classifyCauseCode(error),
    aborted:
      error?.code === "TIMEOUT"
      || cause?.name
         === "AbortError",
    requestMethod: "POST",
    providerHost:
      endpoint.host,
    providerPath:
      endpoint.path,
  });
}

export function emitSafeTransportDiagnostic({
  logger,
  diagnostic,
}) {
  if (typeof logger !== "function") {
    return false;
  }

  try {
    logger(diagnostic);
    return true;
  } catch {
    return false;
  }
}

export function logSafeTransportDiagnostic(
  diagnostic,
) {
  process.stderr.write(
    `${JSON.stringify(diagnostic)}\n`,
  );
}
