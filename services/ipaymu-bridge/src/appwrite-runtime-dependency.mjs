const requiredTablesMethods = [
  "listRows",
  "createTransaction",
  "getRow",
  "updateRow",
  "incrementRowColumn",
  "decrementRowColumn",
  "updateTransaction",
];

function requireObject(
  value,
  label,
) {
  if (
    value === null
    || typeof value !== "object"
    || Array.isArray(value)
  ) {
    throw new TypeError(
      `${label} must be an object.`,
    );
  }

  return value;
}

function requireApi(
  value,
  label,
) {
  if (
    value === null
    || (
      typeof value !== "object"
      && typeof value !== "function"
    )
    || Array.isArray(value)
  ) {
    throw new TypeError(
      `${label} must be an object or function.`,
    );
  }

  return value;
}

function requireText(
  value,
  label,
) {
  if (typeof value !== "string") {
    throw new TypeError(
      `${label} must be a string.`,
    );
  }

  const cleaned = value.trim();

  if (!cleaned) {
    throw new TypeError(
      `${label} must not be empty.`,
    );
  }

  return cleaned;
}

function requireConstructor(
  value,
  label,
) {
  if (typeof value !== "function") {
    throw new TypeError(
      `${label} must be a constructor.`,
    );
  }

  return value;
}

function requireMethod(
  object,
  method,
  label,
) {
  if (
    object === null
    || typeof object !== "object"
    || typeof object[method] !== "function"
  ) {
    throw new TypeError(
      `${label}.${method} must be a function.`,
    );
  }
}

function validateAppwriteConfig(
  config,
) {
  requireObject(
    config,
    "config",
  );

  const appwrite =
    requireObject(
      config.appwrite,
      "config.appwrite",
    );

  return {
    endpoint:
      requireText(
        appwrite.endpoint,
        "config.appwrite.endpoint",
      ),

    projectId:
      requireText(
        appwrite.projectId,
        "config.appwrite.projectId",
      ),

    apiKey:
      requireText(
        appwrite.apiKey,
        "config.appwrite.apiKey",
      ),

    databaseId:
      requireText(
        appwrite.databaseId,
        "config.appwrite.databaseId",
      ),

    bookingsTableId:
      requireText(
        appwrite.bookingsTableId,
        "config.appwrite.bookingsTableId",
      ),

    tripInventoryTableId:
      requireText(
        appwrite.tripInventoryTableId,
        "config.appwrite.tripInventoryTableId",
      ),
  };
}

export function
createAppwriteRuntimeDependency({
  config,
  ClientCtor,
  TablesDBCtor,
  QueryApi,
} = {}) {
  const appwrite =
    validateAppwriteConfig(
      config,
    );

  requireConstructor(
    ClientCtor,
    "ClientCtor",
  );

  requireConstructor(
    TablesDBCtor,
    "TablesDBCtor",
  );

  requireApi(
    QueryApi,
    "QueryApi",
  );

  if (
    typeof QueryApi.equal
      !== "function"
  ) {
    throw new TypeError(
      "QueryApi.equal must be a function.",
    );
  }

  if (
    typeof QueryApi.limit
      !== "function"
  ) {
    throw new TypeError(
      "QueryApi.limit must be a function.",
    );
  }

  const client =
    new ClientCtor();

  requireMethod(
    client,
    "setEndpoint",
    "client",
  );

  requireMethod(
    client,
    "setProject",
    "client",
  );

  requireMethod(
    client,
    "setKey",
    "client",
  );

  client
    .setEndpoint(
      appwrite.endpoint,
    )
    .setProject(
      appwrite.projectId,
    )
    .setKey(
      appwrite.apiKey,
    );

  const tablesDB =
    new TablesDBCtor(client);

  for (
    const method
    of requiredTablesMethods
  ) {
    requireMethod(
      tablesDB,
      method,
      "tablesDB",
    );
  }

  return {
    tablesDB,

    appwriteConfig: {
      databaseId:
        appwrite.databaseId,

      bookingsTableId:
        appwrite.bookingsTableId,

      tripInventoryTableId:
        appwrite.tripInventoryTableId,
    },

    queryEqualImpl:
      (column, values) =>
        QueryApi.equal(
          column,
          values,
        ),

    queryLimitImpl:
      (limit) =>
        QueryApi.limit(
          limit,
        ),
  };
}
