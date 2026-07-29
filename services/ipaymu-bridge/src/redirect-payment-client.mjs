import {
  buildRedirectPaymentRequest,
} from "./redirect-payment-request.mjs";

import {
  IpaymuResponseError,
  parseRedirectPaymentResponse,
} from "./redirect-payment-response.mjs";

import {
  inferIpaymuTransportStage,
} from "./safe-transport-observability.mjs";

export class IpaymuTransportError extends Error {
  constructor({
    code,
    message,
    status = null,
    cause,
    stage =
      inferIpaymuTransportStage(code),
  }) {
    super(message, {
      cause,
    });

    this.name = "IpaymuTransportError";
    this.code = code;
    this.status = status;
    this.stage = stage;
  }
}

function requireFetch(fetchImpl) {
  if (typeof fetchImpl !== "function") {
    throw new TypeError(
      "fetchImpl must be a function.",
    );
  }

  return fetchImpl;
}

function requireTimeout(timeoutMs) {
  if (
    !Number.isSafeInteger(timeoutMs)
    || timeoutMs <= 0
  ) {
    throw new TypeError(
      "timeoutMs must be a positive integer.",
    );
  }

  return timeoutMs;
}

async function readJsonResponse(response) {
  if (
    response === null
    || typeof response !== "object"
    || !Number.isSafeInteger(response.status)
    || typeof response.text !== "function"
  ) {
    throw new IpaymuTransportError({
      code: "INVALID_HTTP_RESPONSE",
      message:
        "iPaymu transport returned an invalid HTTP response.",
    });
  }

  const text = await response.text();

  if (
    typeof text !== "string"
    || text.trim().length === 0
  ) {
    throw new IpaymuTransportError({
      code: "EMPTY_RESPONSE",
      message:
        "iPaymu returned an empty response.",
      status: response.status,
    });
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new IpaymuTransportError({
      code: "INVALID_JSON",
      message:
        "iPaymu returned invalid JSON.",
      status: response.status,
      cause: error,
    });
  }
}

function parseApiResponse(
  rawResponse,
  httpStatus,
) {
  let parsed;

  try {
    parsed =
      parseRedirectPaymentResponse(
        rawResponse,
      );
  } catch (error) {
    if (
      error instanceof
        IpaymuResponseError
    ) {
      throw error;
    }

    throw new IpaymuTransportError({
      code: "INVALID_API_RESPONSE",
      message:
        "iPaymu returned an invalid response envelope.",
      status: httpStatus,
      cause: error,
    });
  }

  if (
    httpStatus < 200
    || httpStatus >= 300
  ) {
    throw new IpaymuTransportError({
      code: "HTTP_ERROR",
      message:
        `iPaymu returned HTTP ${httpStatus}.`,
      status: httpStatus,
    });
  }

  return parsed;
}

export async function createRedirectPayment({
  config,
  payload,
  now = new Date(),
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
}) {
  const transport =
    requireFetch(fetchImpl);

  const timeout =
    requireTimeout(timeoutMs);

  const request =
    buildRedirectPaymentRequest({
      config,
      payload,
      now,
    });

  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeout,
  );

  try {
    let response;

    try {
      response = await transport(
        request.url,
        {
          method: request.method,
          headers: request.headers,
          body: request.body,
          signal: controller.signal,
          redirect: "error",
        },
      );
    } catch (error) {
      if (controller.signal.aborted) {
        throw new IpaymuTransportError({
          code: "TIMEOUT",
          message:
            `iPaymu request timed out after ${timeout}ms.`,
          cause: error,
        });
      }

      throw new IpaymuTransportError({
        code: "NETWORK_ERROR",
        message:
          "Unable to connect to iPaymu.",
        cause: error,
      });
    }

    const rawResponse =
      await readJsonResponse(response);

    const payment =
      parseApiResponse(
        rawResponse,
        response.status,
      );

    return {
      ...payment,

      referenceId:
        String(payload.referenceId),
    };
  } finally {
    clearTimeout(timer);
  }
}
