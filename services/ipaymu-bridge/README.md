# NusaGiliBoat iPaymu Bridge

Initial disabled scaffold for the iPaymu server-side bridge.

Current safety state:

- no VA or API Key;
- no request to iPaymu;
- no transaction creation;
- no callback processing;
- no Appwrite update;
- no seat lifecycle update;
- no production deployment.

Available endpoints:

- `GET /ipaymu-bridge/health`
- `GET /ipaymu-bridge/ready`

The readiness endpoint intentionally returns HTTP 503 until the next
integration stages are completed.
