import {
  Client,
  Query,
  TablesDB,
} from "node-appwrite";

import {
  createAppwriteCallbackAdapter,
} from "./appwrite-callback-adapter.mjs";

import {
  createHttpCallbackAdapter,
} from "./http-callback-adapter.mjs";

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

  callbackLifecycleEndpoint =
    process.env
      .IPAYMU_CALLBACK_LIFECYCLE_ENDPOINT
      || "",

  callbackLifecycleToken =
    process.env
      .IPAYMU_CALLBACK_LIFECYCLE_TOKEN
      || "",

  transactionTtl = 60,
} = {}) {
  const runtimeConfig =
    requireConfig(config);

  const readiness =
    getReadiness(runtimeConfig);

  if (!readiness.ready) {
    return {};
  }

  const callbackEndpoint =
    String(
      callbackLifecycleEndpoint
        || "",
    ).trim();

  const callbackToken =
    String(
      callbackLifecycleToken
        || "",
    ).trim();

  const useHttpCallback =
    Boolean(
      callbackEndpoint
      || callbackToken
    );

  if (
    useHttpCallback
    && (
      !callbackEndpoint
      || !callbackToken
    )
  ) {
    throw new TypeError(
      "IPAYMU callback lifecycle endpoint and token must be configured together.",
    );
  }

  let callbackAdapter;

  if (useHttpCallback) {
    callbackAdapter =
      createHttpCallbackAdapter({
        endpoint:
          callbackEndpoint,

        token:
          callbackToken,

        fetchImpl,
        timeoutMs,
      });
  } else {
    const appwriteRuntime =
      createAppwriteRuntimeDependency({
        config:
          runtimeConfig,

        ClientCtor,
        TablesDBCtor,
        QueryApi,
      });

    callbackAdapter =
      createAppwriteCallbackAdapter({
        ...appwriteRuntime,
        transactionTtl,
      });
  }

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
