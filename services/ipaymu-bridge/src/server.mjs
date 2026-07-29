import {
  createServer,
} from "node:http";

import {
  pathToFileURL,
} from "node:url";

import {
  getReadiness,
  loadConfig,
} from "./config.mjs";

import {
  handleCallbackCommand,
} from "./callback-command.mjs";

import {
  createRuntimeDependencies,
} from "./runtime-dependencies.mjs";

import {
  handleTransactionCommand,
} from "./transaction-command.mjs";

import {
  logSafeTransportDiagnostic,
} from "./safe-transport-observability.mjs";

function sendJson(
  response,
  statusCode,
  payload,
) {
  const body = JSON.stringify(payload);

  response.writeHead(statusCode, {
    "Content-Type":
      "application/json; charset=utf-8",
    "Content-Length":
      Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
  });

  response.end(body);
}

const MAX_REQUEST_BODY_BYTES =
  64 * 1024;

function readRequestBody(request) {
  return new Promise(
    (resolve, reject) => {
      const chunks = [];
      let size = 0;
      let tooLarge = false;

      request.on("data", (chunk) => {
        const buffer =
          Buffer.isBuffer(chunk)
            ? chunk
            : Buffer.from(chunk);

        size += buffer.length;

        if (
          size
            > MAX_REQUEST_BODY_BYTES
        ) {
          tooLarge = true;
          chunks.length = 0;
          return;
        }

        if (!tooLarge) {
          chunks.push(buffer);
        }
      });

      request.on("end", () => {
        if (tooLarge) {
          const error = new Error(
            "Request body exceeds 64 KiB.",
          );

          error.code =
            "BODY_TOO_LARGE";

          reject(error);
          return;
        }

        resolve(
          Buffer.concat(chunks)
            .toString("utf8"),
        );
      });

      request.on("aborted", () => {
        const error = new Error(
          "Request body was aborted.",
        );

        error.code =
          "REQUEST_ABORTED";

        reject(error);
      });

      request.on("error", reject);
    },
  );
}

export function createBridgeServer(
  config = loadConfig(),
  dependencies = {},
) {
  const prefix = config.prefix;

  return createServer(
    (request, response) => {
      const url = new URL(
        request.url || "/",
        "http://localhost",
      );

      if (
        request.method === "GET"
        && url.pathname === `${prefix}/health`
      ) {
        sendJson(response, 200, {
          ok: true,
          service: config.serviceName,
          version: config.serviceVersion,
          environment: config.environment,
          enabled: config.enabled,
        });

        return;
      }

      if (
        request.method === "GET"
        && url.pathname === `${prefix}/ready`
      ) {
        const readiness =
          getReadiness(config);

        sendJson(
          response,
          readiness.ready ? 200 : 503,
          {
            ok: readiness.ready,
            service: config.serviceName,
            environment: config.environment,
            missing: readiness.missing,
          },
        );

        return;
      }

      if (
        request.method === "POST"
        && url.pathname
          === `${prefix}/transactions`
      ) {
        const readiness =
          getReadiness(config);

        if (!readiness.ready) {
          sendJson(response, 503, {
            ok: false,
            code:
              "IPAYMU_BRIDGE_DISABLED",
          });

          return;
        }

        void (async () => {
          try {
            const rawBody =
              await readRequestBody(
                request,
              );

            const result =
              await handleTransactionCommand({
                config,
                headers:
                  request.headers,
                rawBody,
                createPaymentImpl:
                  dependencies
                    .createPaymentImpl,

                transportDiagnosticLogger:
                  dependencies
                    .transportDiagnosticLogger,
              });

            sendJson(
              response,
              result.statusCode,
              result.body,
            );
          } catch (error) {
            if (response.writableEnded) {
              return;
            }

            if (
              error?.code
                === "BODY_TOO_LARGE"
            ) {
              sendJson(response, 413, {
                ok: false,
                code:
                  "PAYLOAD_TOO_LARGE",
              });

              return;
            }

            sendJson(response, 400, {
              ok: false,
              code:
                "INVALID_HTTP_REQUEST",
            });
          }
        })();

        return;
      }

      if (
        request.method === "POST"
        && url.pathname
          === `${prefix}/callback`
      ) {
        const readiness =
          getReadiness(config);

        if (!readiness.ready) {
          sendJson(response, 503, {
            ok: false,
            code: "IPAYMU_BRIDGE_DISABLED",
          });

          return;
        }

        if (
          typeof dependencies
            .processCallbackImpl
            !== "function"
        ) {
          sendJson(response, 501, {
            ok: false,
            code:
              "CALLBACK_PROCESSING_NOT_CONNECTED",
          });

          return;
        }

        void (async () => {
          try {
            const rawBody =
              await readRequestBody(
                request,
              );

            const result =
              await handleCallbackCommand({
                config,
                headers:
                  request.headers,
                rawBody,
                processCallbackImpl:
                  dependencies
                    .processCallbackImpl,
              });

            sendJson(
              response,
              result.statusCode,
              result.body,
            );
          } catch (error) {
            if (response.writableEnded) {
              return;
            }

            if (
              error?.code
                === "BODY_TOO_LARGE"
            ) {
              sendJson(response, 413, {
                ok: false,
                code:
                  "PAYLOAD_TOO_LARGE",
              });

              return;
            }

            sendJson(response, 400, {
              ok: false,
              code:
                "INVALID_HTTP_REQUEST",
            });
          }
        })();

        return;
      }

      sendJson(response, 404, {
        ok: false,
        code: "NOT_FOUND",
      });
    },
  );
}

export function createRuntimeBridgeServer({
  config = loadConfig(),
  fetchImpl = globalThis.fetch,
  nowFactory,
  timeoutMs = 10000,
  ClientCtor,
  TablesDBCtor,
  QueryApi,
  transactionTtl = 60,
  transportDiagnosticLogger =
    logSafeTransportDiagnostic,
} = {}) {
  const dependencies =
    createRuntimeDependencies({
      config,
      fetchImpl,
      nowFactory,
      timeoutMs,
      ClientCtor,
      TablesDBCtor,
      QueryApi,
      transactionTtl,
    });

  return {
    config,

    server:
      createBridgeServer(
        config,
        {
          ...dependencies,
          transportDiagnosticLogger,
        },
      ),
  };
}

function startServer() {
  const {
    config,
    server,
  } = createRuntimeBridgeServer();

  server.listen(
    config.port,
    config.host,
    () => {
      console.log(
        JSON.stringify({
          event: "server_started",
          service: config.serviceName,
          version: config.serviceVersion,
          host: config.host,
          port: config.port,
          prefix: config.prefix,
          environment: config.environment,
          enabled: config.enabled,
        }),
      );
    },
  );

  const shutdown = (signal) => {
    console.log(
      JSON.stringify({
        event: "server_stopping",
        signal,
      }),
    );

    server.close(() => {
      process.exit(0);
    });

    setTimeout(() => {
      process.exit(1);
    }, 10000).unref();
  };

  process.on(
    "SIGTERM",
    () => shutdown("SIGTERM"),
  );

  process.on(
    "SIGINT",
    () => shutdown("SIGINT"),
  );
}

const executedFile =
  process.argv[1]
    ? pathToFileURL(process.argv[1]).href
    : "";

if (import.meta.url === executedFile) {
  startServer();
}
