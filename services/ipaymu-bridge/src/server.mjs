import { createServer } from "node:http";

const host = process.env.HOST || "0.0.0.0";
const port = Number.parseInt(process.env.PORT || "8080", 10);
const prefix = (
  process.env.IPAYMU_BRIDGE_PREFIX || "/ipaymu-bridge"
).replace(/\/$/, "");

function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);

  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });

  response.end(body);
}

const server = createServer((request, response) => {
  const url = new URL(
    request.url || "/",
    "http://localhost"
  );

  if (
    request.method === "GET" &&
    url.pathname === `${prefix}/health`
  ) {
    sendJson(response, 200, {
      ok: true,
      service: "nusagiliboat-ipaymu-bridge",
      version: "0.1.0",
      enabled: false
    });

    return;
  }

  if (
    request.method === "GET" &&
    url.pathname === `${prefix}/ready`
  ) {
    sendJson(response, 503, {
      ok: false,
      code: "SCAFFOLD_ONLY",
      message: "iPaymu integration is not enabled."
    });

    return;
  }

  sendJson(response, 404, {
    ok: false,
    code: "NOT_FOUND"
  });
});

server.listen(port, host, () => {
  console.log(
    JSON.stringify({
      event: "server_started",
      host,
      port,
      prefix,
      enabled: false
    })
  );
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
