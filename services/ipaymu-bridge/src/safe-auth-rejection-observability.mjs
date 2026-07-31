import {
  randomUUID,
} from "node:crypto";

const REQUEST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const REJECTION_CODE_BY_ROUTE =
  new Map([
    [
      "transactions",
      "UNAUTHORIZED",
    ],
    [
      "callback",
      "INVALID_CALLBACK_SIGNATURE",
    ],
  ]);

export function createRequestCorrelationId() {
  const requestId = randomUUID();

  if (!REQUEST_ID_PATTERN.test(requestId)) {
    throw new TypeError(
      "Generated request correlation ID is invalid.",
    );
  }

  return requestId;
}

export function logSafeAuthRejectionDiagnostic({
  requestId,
  route,
  statusCode,
  code,
}) {
  if (
    typeof requestId !== "string"
    || !REQUEST_ID_PATTERN.test(requestId)
  ) {
    return false;
  }

  if (
    statusCode !== 401
    || REJECTION_CODE_BY_ROUTE.get(route)
      !== code
  ) {
    return false;
  }

  const diagnostic = {
    event: "ipaymu_auth_rejection",
    requestId,
    route,
    statusCode,
    code,
  };

  try {
    process.stderr.write(
      `${JSON.stringify(diagnostic)}\n`,
    );

    return true;
  } catch {
    return false;
  }
}
