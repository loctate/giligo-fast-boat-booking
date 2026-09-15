export class
HttpCallbackAdapterError
  extends Error {
  constructor(
    code,
    message,
    {
      status = null,
      cause = null,
    } = {},
  ) {
    super(message, {
      cause,
    });

    this.name =
      "HttpCallbackAdapterError";

    this.code =
      code;

    this.status =
      status;
  }
}

function requireText(
  value,
  label,
) {
  const normalized =
    String(value ?? "")
      .trim();

  if (!normalized) {
    throw new TypeError(
      `${label} is required.`,
    );
  }

  return normalized;
}

function normalizeEndpoint(
  value,
) {
  const normalized =
    requireText(
      value,
      "endpoint",
    );

  let parsed;

  try {
    parsed =
      new URL(normalized);
  } catch {
    throw new TypeError(
      "endpoint must be a valid URL.",
    );
  }

  const localHttp =
    parsed.protocol === "http:"
    && (
      parsed.hostname === "127.0.0.1"
      || parsed.hostname === "localhost"
    );

  if (
    parsed.protocol !== "https:"
    && !localHttp
  ) {
    throw new TypeError(
      "endpoint must use HTTPS.",
    );
  }

  return parsed.toString();
}

async function responseJson(
  response,
) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function
createHttpCallbackAdapter({
  endpoint,
  token,
  fetchImpl = globalThis.fetch,
  timeoutMs = 10000,
} = {}) {
  const callbackEndpoint =
    normalizeEndpoint(
      endpoint,
    );

  const bearerToken =
    requireText(
      token,
      "token",
    );

  if (
    typeof fetchImpl !==
      "function"
  ) {
    throw new TypeError(
      "fetchImpl must be a function.",
    );
  }

  if (
    !Number.isInteger(timeoutMs)
    || timeoutMs < 100
    || timeoutMs > 60000
  ) {
    throw new TypeError(
      "timeoutMs must be between 100 and 60000 milliseconds.",
    );
  }

  async function invoke(
    operation,
    payload,
  ) {
    const controller =
      new AbortController();

    const timer =
      setTimeout(
        () => {
          controller.abort();
        },
        timeoutMs,
      );

    try {
      const response =
        await fetchImpl(
          callbackEndpoint,
          {
            method: "POST",

            headers: {
              authorization:
                `Bearer ${bearerToken}`,

              "content-type":
                "application/json",

              accept:
                "application/json",
            },

            body:
              JSON.stringify({
                operation,
                ...payload,
              }),

            signal:
              controller.signal,
          },
        );

      const body =
        await responseJson(
          response,
        );

      if (!response.ok) {
        throw new HttpCallbackAdapterError(
          body?.code ||
            "CALLBACK_LIFECYCLE_HTTP_ERROR",
          "Callback lifecycle service rejected the request.",
          {
            status:
              response.status,
          },
        );
      }

      if (
        body === null
        || typeof body !==
          "object"
        || Array.isArray(body)
        || body.success !== true
      ) {
        throw new HttpCallbackAdapterError(
          "INVALID_CALLBACK_LIFECYCLE_RESPONSE",
          "Callback lifecycle service returned an invalid response.",
          {
            status:
              response.status,
          },
        );
      }

      return body.result;
    } catch (error) {
      if (
        error instanceof
          HttpCallbackAdapterError
      ) {
        throw error;
      }

      if (
        error?.name ===
          "AbortError"
      ) {
        throw new HttpCallbackAdapterError(
          "CALLBACK_LIFECYCLE_TIMEOUT",
          "Callback lifecycle request timed out.",
          {
            cause: error,
          },
        );
      }

      throw new HttpCallbackAdapterError(
        "CALLBACK_LIFECYCLE_TRANSPORT_ERROR",
        "Callback lifecycle service could not be reached.",
        {
          cause: error,
        },
      );
    } finally {
      clearTimeout(timer);
    }
  }

  async function
  findBookingByCodeImpl(
    bookingCode,
  ) {
    const result =
      await invoke(
        "lookup",
        {
          bookingCode:
            requireText(
              bookingCode,
              "bookingCode",
            ),
        },
      );

    if (!Array.isArray(result)) {
      throw new HttpCallbackAdapterError(
        "INVALID_BOOKING_LOOKUP_RESULT",
        "Callback lifecycle booking lookup returned an invalid result.",
      );
    }

    return result;
  }

  async function
  applyLifecycleImpl(
    mutation,
  ) {
    if (
      mutation === null
      || typeof mutation !==
        "object"
      || Array.isArray(mutation)
    ) {
      throw new TypeError(
        "mutation must be an object.",
      );
    }

    const result =
      await invoke(
        "apply",
        {
          mutation,
        },
      );

    if (
      result === null
      || typeof result !==
        "object"
      || Array.isArray(result)
    ) {
      throw new HttpCallbackAdapterError(
        "INVALID_LIFECYCLE_RESULT",
        "Callback lifecycle mutation returned an invalid result.",
      );
    }

    return result;
  }

  return {
    findBookingByCodeImpl,
    applyLifecycleImpl,
  };
}
