import {
  getReadiness,
} from "./config.mjs";

import {
  createPaymentDependency,
} from "./payment-dependency.mjs";

function requireConfig(config) {
  if (
    config === null
    || typeof config !== "object"
    || Array.isArray(config)
  ) {
    throw new TypeError(
      "config must be an object.",
    );
  }

  return config;
}

export function createRuntimeDependencies({
  config,
  fetchImpl,
  nowFactory,
  timeoutMs = 10000,
} = {}) {
  const runtimeConfig =
    requireConfig(config);

  const readiness =
    getReadiness(runtimeConfig);

  if (!readiness.ready) {
    return {};
  }

  return {
    createPaymentImpl:
      createPaymentDependency({
        fetchImpl,
        nowFactory,
        timeoutMs,
      }),
  };
}
