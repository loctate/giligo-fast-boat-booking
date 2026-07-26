import {
  createRedirectPayment,
} from "./redirect-payment-client.mjs";

function requireFunction(value, name) {
  if (typeof value !== "function") {
    throw new TypeError(
      `${name} must be a function.`,
    );
  }

  return value;
}

function requirePositiveInteger(value, name) {
  if (
    !Number.isSafeInteger(value)
    || value <= 0
  ) {
    throw new TypeError(
      `${name} must be a positive integer.`,
    );
  }

  return value;
}

export function createPaymentDependency({
  fetchImpl,
  nowFactory = () => new Date(),
  timeoutMs = 10000,
} = {}) {
  const transport = requireFunction(
    fetchImpl,
    "fetchImpl",
  );

  const clock = requireFunction(
    nowFactory,
    "nowFactory",
  );

  const timeout = requirePositiveInteger(
    timeoutMs,
    "timeoutMs",
  );

  return async function createPayment({
    config,
    payload,
  }) {
    const now = clock();

    if (
      !(now instanceof Date)
      || Number.isNaN(now.getTime())
    ) {
      throw new TypeError(
        "nowFactory must return a valid Date.",
      );
    }

    return createRedirectPayment({
      config,
      payload,
      now,
      fetchImpl: transport,
      timeoutMs: timeout,
    });
  };
}
