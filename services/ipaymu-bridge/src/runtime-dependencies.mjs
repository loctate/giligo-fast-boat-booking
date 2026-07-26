import {
  Client,
  Query,
  TablesDB,
} from "node-appwrite";

import {
  createAppwriteCallbackAdapter,
} from "./appwrite-callback-adapter.mjs";

import {
  createAppwriteRuntimeDependency,
} from "./appwrite-runtime-dependency.mjs";

import {
  createCallbackProcessor,
} from "./callback-processor.mjs";

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
  ClientCtor = Client,
  TablesDBCtor = TablesDB,
  QueryApi = Query,
  transactionTtl = 60,
} = {}) {
  const runtimeConfig =
    requireConfig(config);

  const readiness =
    getReadiness(runtimeConfig);

  if (!readiness.ready) {
    return {};
  }

  const appwriteRuntime =
    createAppwriteRuntimeDependency({
      config:
        runtimeConfig,

      ClientCtor,
      TablesDBCtor,
      QueryApi,
    });

  const callbackAdapter =
    createAppwriteCallbackAdapter({
      ...appwriteRuntime,
      transactionTtl,
    });

  return {
    createPaymentImpl:
      createPaymentDependency({
        fetchImpl,
        nowFactory,
        timeoutMs,
      }),

    processCallbackImpl:
      createCallbackProcessor({
        ...callbackAdapter,
      }),
  };
}
