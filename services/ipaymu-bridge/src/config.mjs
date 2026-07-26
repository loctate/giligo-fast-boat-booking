import {
  SERVICE_NAME,
  SERVICE_VERSION,
} from "./service-metadata.mjs";

const TRUE_VALUES = new Set([
  "1",
  "true",
  "yes",
  "on",
]);

function readBoolean(value, fallback = false) {
  if (
    value === undefined
    || value === null
    || value === ""
  ) {
    return fallback;
  }

  return TRUE_VALUES.has(
    String(value).trim().toLowerCase(),
  );
}

function readPositiveInteger(value, fallback, name) {
  if (
    value === undefined
    || value === null
    || value === ""
  ) {
    return fallback;
  }

  const parsed = Number.parseInt(String(value), 10);

  if (
    !Number.isSafeInteger(parsed)
    || parsed <= 0
  ) {
    throw new Error(
      `${name} must be a positive integer.`,
    );
  }

  return parsed;
}

function normalizePrefix(value) {
  const prefix = String(
    value || "/ipaymu-bridge",
  ).trim();

  if (!prefix.startsWith("/")) {
    throw new Error(
      "IPAYMU_BRIDGE_PREFIX must start with '/'.",
    );
  }

  if (prefix === "/") {
    throw new Error(
      "IPAYMU_BRIDGE_PREFIX cannot be '/'.",
    );
  }

  return prefix.endsWith("/")
    ? prefix.slice(0, -1)
    : prefix;
}

export function loadConfig(env = process.env) {
  const environment = String(
    env.IPAYMU_ENVIRONMENT || "sandbox",
  )
    .trim()
    .toLowerCase();

  if (
    environment !== "sandbox"
    && environment !== "production"
  ) {
    throw new Error(
      "IPAYMU_ENVIRONMENT must be sandbox or production.",
    );
  }

  return {
    serviceName: SERVICE_NAME,
    serviceVersion: SERVICE_VERSION,

    host: String(
      env.HOST || "0.0.0.0",
    ),

    port: readPositiveInteger(
      env.PORT,
      8080,
      "PORT",
    ),

    prefix: normalizePrefix(
      env.IPAYMU_BRIDGE_PREFIX,
    ),

    enabled: readBoolean(
      env.IPAYMU_ENABLED,
      false,
    ),

    environment,

    apiBaseUrl: String(
      env.IPAYMU_API_BASE_URL || "",
    ).trim(),

    va: String(
      env.IPAYMU_VA || "",
    ).trim(),

    apiKey: String(
      env.IPAYMU_API_KEY || "",
    ).trim(),

    internalToken: String(
      env.IPAYMU_BRIDGE_INTERNAL_TOKEN || "",
    ).trim(),

    appwrite: {
      endpoint: String(
        env.APPWRITE_ENDPOINT || "",
      ).trim(),

      projectId: String(
        env.APPWRITE_PROJECT_ID || "",
      ).trim(),

      apiKey: String(
        env.APPWRITE_API_KEY || "",
      ).trim(),

      databaseId: String(
        env.APPWRITE_DATABASE_ID || "",
      ).trim(),

      bookingsTableId: String(
        env.APPWRITE_BOOKINGS_TABLE_ID || "",
      ).trim(),

      tripInventoryTableId: String(
        env.APPWRITE_TRIP_INVENTORY_TABLE_ID || "",
      ).trim(),
    },
  };
}

export function getReadiness(config) {
  const missing = [];

  if (!config.enabled) {
    missing.push("IPAYMU_ENABLED=true");
  } else {
    if (!config.apiBaseUrl) {
      missing.push("IPAYMU_API_BASE_URL");
    }

    if (!config.va) {
      missing.push("IPAYMU_VA");
    }

    if (!config.apiKey) {
      missing.push("IPAYMU_API_KEY");
    }

    if (!config.internalToken) {
      missing.push(
        "IPAYMU_BRIDGE_INTERNAL_TOKEN",
      );
    }

    if (!config.appwrite?.endpoint) {
      missing.push(
        "APPWRITE_ENDPOINT",
      );
    }

    if (!config.appwrite?.projectId) {
      missing.push(
        "APPWRITE_PROJECT_ID",
      );
    }

    if (!config.appwrite?.apiKey) {
      missing.push(
        "APPWRITE_API_KEY",
      );
    }

    if (!config.appwrite?.databaseId) {
      missing.push(
        "APPWRITE_DATABASE_ID",
      );
    }

    if (!config.appwrite?.bookingsTableId) {
      missing.push(
        "APPWRITE_BOOKINGS_TABLE_ID",
      );
    }

    if (
      !config.appwrite
        ?.tripInventoryTableId
    ) {
      missing.push(
        "APPWRITE_TRIP_INVENTORY_TABLE_ID",
      );
    }
  }

  return {
    ready:
      config.enabled
      && missing.length === 0,

    missing,
  };
}
