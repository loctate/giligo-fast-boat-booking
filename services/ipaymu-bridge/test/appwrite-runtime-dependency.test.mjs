import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppwriteRuntimeDependency,
} from "../src/appwrite-runtime-dependency.mjs";

function readyConfig(
  overrides = {},
) {
  return {
    appwrite: {
      endpoint:
        "https://appwrite.example.invalid/v1",

      projectId:
        "project-test",

      apiKey:
        "server-api-key-test",

      databaseId:
        "database-test",

      bookingsTableId:
        "bookings-test",

      tripInventoryTableId:
        "inventory-test",

      ...overrides,
    },
  };
}

function createSdkMocks({
  omitMethod = null,
} = {}) {
  const calls = {
    constructors: {
      client: 0,
      tablesDB: 0,
    },

    setters: [],
    databaseMethods: [],
    query: [],
  };

  class MockClient {
    constructor() {
      calls.constructors.client += 1;
    }

    setEndpoint(value) {
      calls.setters.push([
        "endpoint",
        value,
      ]);

      return this;
    }

    setProject(value) {
      calls.setters.push([
        "project",
        value,
      ]);

      return this;
    }

    setKey(value) {
      calls.setters.push([
        "key",
        value,
      ]);

      return this;
    }
  }

  class MockTablesDB {
    constructor(client) {
      calls.constructors.tablesDB += 1;
      this.client = client;
    }

    async listRows() {
      calls.databaseMethods.push(
        "listRows",
      );
    }

    async createTransaction() {
      calls.databaseMethods.push(
        "createTransaction",
      );
    }

    async getRow() {
      calls.databaseMethods.push(
        "getRow",
      );
    }

    async updateRow() {
      calls.databaseMethods.push(
        "updateRow",
      );
    }

    async incrementRowColumn() {
      calls.databaseMethods.push(
        "incrementRowColumn",
      );
    }

    async decrementRowColumn() {
      calls.databaseMethods.push(
        "decrementRowColumn",
      );
    }

    async updateTransaction() {
      calls.databaseMethods.push(
        "updateTransaction",
      );
    }
  }

  if (omitMethod) {
    MockTablesDB.prototype[
      omitMethod
    ] = undefined;
  }

  const QueryApi = {
    equal(column, values) {
      calls.query.push({
        type:
          "equal",

        column,
        values,
      });

      return {
        type:
          "equal",

        column,
        values,
      };
    },

    limit(limit) {
      calls.query.push({
        type:
          "limit",

        limit,
      });

      return {
        type:
          "limit",

        limit,
      };
    },
  };

  return {
    ClientCtor:
      MockClient,

    TablesDBCtor:
      MockTablesDB,

    QueryApi,
    calls,
  };
}

test(
  "creates Appwrite dependencies without database requests",
  () => {
    const sdk =
      createSdkMocks();

    const dependency =
      createAppwriteRuntimeDependency({
        config:
          readyConfig(),

        ClientCtor:
          sdk.ClientCtor,

        TablesDBCtor:
          sdk.TablesDBCtor,

        QueryApi:
          sdk.QueryApi,
      });

    assert.equal(
      sdk.calls
        .constructors.client,
      1,
    );

    assert.equal(
      sdk.calls
        .constructors.tablesDB,
      1,
    );

    assert.deepEqual(
      sdk.calls.setters,
      [
        [
          "endpoint",
          "https://appwrite.example.invalid/v1",
        ],

        [
          "project",
          "project-test",
        ],

        [
          "key",
          "server-api-key-test",
        ],
      ],
    );

    assert.deepEqual(
      sdk.calls.databaseMethods,
      [],
    );

    assert.deepEqual(
      dependency.appwriteConfig,
      {
        databaseId:
          "database-test",

        bookingsTableId:
          "bookings-test",

        tripInventoryTableId:
          "inventory-test",
      },
    );
  },
);

test(
  "query wrappers use injected Query API",
  () => {
    const sdk =
      createSdkMocks();

    const dependency =
      createAppwriteRuntimeDependency({
        config:
          readyConfig(),

        ClientCtor:
          sdk.ClientCtor,

        TablesDBCtor:
          sdk.TablesDBCtor,

        QueryApi:
          sdk.QueryApi,
      });

    assert.deepEqual(
      dependency
        .queryEqualImpl(
          "bookingCode",
          ["NGB-TEST-001"],
        ),
      {
        type:
          "equal",

        column:
          "bookingCode",

        values: [
          "NGB-TEST-001",
        ],
      },
    );

    assert.deepEqual(
      dependency
        .queryLimitImpl(2),
      {
        type:
          "limit",

        limit:
          2,
      },
    );

    assert.equal(
      sdk.calls.query.length,
      2,
    );

    assert.deepEqual(
      sdk.calls.databaseMethods,
      [],
    );
  },
);

test(
  "rejects incomplete Appwrite configuration",
  () => {
    const sdk =
      createSdkMocks();

    assert.throws(
      () =>
        createAppwriteRuntimeDependency({
          config:
            readyConfig({
              endpoint:
                "",
            }),

          ClientCtor:
            sdk.ClientCtor,

          TablesDBCtor:
            sdk.TablesDBCtor,

          QueryApi:
            sdk.QueryApi,
        }),

      /config\.appwrite\.endpoint must not be empty/,
    );
  },
);

test(
  "rejects missing SDK constructors",
  () => {
    const sdk =
      createSdkMocks();

    assert.throws(
      () =>
        createAppwriteRuntimeDependency({
          config:
            readyConfig(),

          ClientCtor:
            null,

          TablesDBCtor:
            sdk.TablesDBCtor,

          QueryApi:
            sdk.QueryApi,
        }),

      /ClientCtor must be a constructor/,
    );
  },
);

test(
  "rejects TablesDB without required methods",
  () => {
    const sdk =
      createSdkMocks({
        omitMethod:
          "updateTransaction",
      });

    assert.throws(
      () =>
        createAppwriteRuntimeDependency({
          config:
            readyConfig(),

          ClientCtor:
            sdk.ClientCtor,

          TablesDBCtor:
            sdk.TablesDBCtor,

          QueryApi:
            sdk.QueryApi,
        }),

      /tablesDB\.updateTransaction must be a function/,
    );

    assert.deepEqual(
      sdk.calls.databaseMethods,
      [],
    );
  },
);

test(
  "accepts callable Query API export",
  () => {
    const sdk =
      createSdkMocks();

    function CallableQueryApi() {}

    CallableQueryApi.equal =
      sdk.QueryApi.equal;

    CallableQueryApi.limit =
      sdk.QueryApi.limit;

    const dependency =
      createAppwriteRuntimeDependency({
        config:
          readyConfig(),

        ClientCtor:
          sdk.ClientCtor,

        TablesDBCtor:
          sdk.TablesDBCtor,

        QueryApi:
          CallableQueryApi,
      });

    assert.deepEqual(
      dependency.queryLimitImpl(2),
      {
        type:
          "limit",

        limit:
          2,
      },
    );

    assert.deepEqual(
      sdk.calls.databaseMethods,
      [],
    );
  },
);
