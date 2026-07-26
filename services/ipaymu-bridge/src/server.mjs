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

export function createBridgeServer(
  config = loadConfig(),
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
            code: "IPAYMU_BRIDGE_DISABLED",
          });

          return;
        }

        sendJson(response, 501, {
          ok: false,
          code:
            "TRANSACTION_CREATION_NOT_CONNECTED",
        });

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

        sendJson(response, 501, {
          ok: false,
          code:
            "CALLBACK_PROCESSING_NOT_CONNECTED",
        });

        return;
      }

      sendJson(response, 404, {
        ok: false,
        code: "NOT_FOUND",
      });
    },
  );
}

function startServer() {
  const config = loadConfig();
  const server =
    createBridgeServer(config);

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
