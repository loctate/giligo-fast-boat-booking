import {
  createHash,
  createHmac,
} from "node:crypto";

function requireText(value, name) {
  if (typeof value !== "string" || value.length === 0) {
    throw new TypeError(
      `${name} must be a non-empty string.`,
    );
  }
}

export function sha256Hex(value) {
  if (typeof value !== "string") {
    throw new TypeError("value must be a string.");
  }

  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}

export function createRequestSignature({
  method,
  va,
  apiKey,
  requestBody,
}) {
  requireText(method, "method");
  requireText(va, "va");
  requireText(apiKey, "apiKey");

  if (typeof requestBody !== "string") {
    throw new TypeError(
      "requestBody must be the exact JSON string used by the request.",
    );
  }

  const normalizedMethod = method.toUpperCase();

  const bodyComponent =
    normalizedMethod === "POST"
      ? sha256Hex(requestBody)
      : requestBody;

  const stringToSign = [
    normalizedMethod,
    va,
    bodyComponent,
    apiKey,
  ].join(":");

  const signature = createHmac("sha256", apiKey)
    .update(stringToSign, "utf8")
    .digest("hex");

  return {
    method: normalizedMethod,
    bodyComponent,
    stringToSign,
    signature,
  };
}
