import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { column, idColumn, table } from "fumadb/schema";

import { collectTables, createRelay } from "./relay";
import { StorageError } from "./fuma-runtime";
import { ScopeId } from "./ids";
import { definePlugin } from "./plugin";
import { Scope } from "./scope";
import { dateColumn, scopedRelayTable, textColumn } from "./core-schema";
import {
  assertRelayScopeAllowed,
  relayScopePolicyName,
  type RelayScopePolicyContext,
} from "./scope-policy";
import { makeTestConfig } from "./test-config";
import { createSqliteTestFumaDb } from "./sqlite-test-db";

const scope = (id: string) =>
  Scope.make({
    id: ScopeId.make(id),
    name: id,
    createdAt: new Date(),
  });

const innerScope = scope("inner");
const outerScope = scope("outer");

const assertScopePolicyTypes = () => {
  const typedTable = scopedRelayTable("typed_item", {
    created_at: dateColumn("created_at"),
    value: textColumn("value"),
  });

  typedTable.policy<RelayScopePolicyContext>({
    name: "typed.scope.test",
    onCreate: ({ values, context }) => {
      assertRelayScopeAllowed("typed_item", "write", values.scope_id, context);

      // @ts-expect-error scope guards only accept scope-like string values
      assertRelayScopeAllowed("typed_item", "write", values.created_at, context);
      // @ts-expect-error policy rows do not expose undeclared table columns
      void values.not_a_column;
    },
    onRead: ({ builder, context }) => {
      const scopeIds = [...context.allowedScopeIds];
      builder("scope_id", "in", scopeIds);
      // @ts-expect-error query guards preserve the selected column value type
      return builder("created_at", "in", scopeIds);
    },
  });
};

void assertScopePolicyTypes;

const leakySchema = {
  leaky_item: scopedRelayTable("leaky_item", {
    value: textColumn("value"),
  }),
};

interface LeakyRow {
  readonly id: string;
  readonly scope_id: string;
  readonly value: string;
}

const leakyPlugin = definePlugin(() => ({
  id: "leaky" as const,
  schema: leakySchema,
  storage: ({ fuma }) => ({
    create: (row: LeakyRow) => fuma.use("leaky.create", (db) => db.create("leaky_item", row)),
    readCoreTable: () =>
      fuma.use("leaky.readCoreTable", (db) =>
        db.findMany("secret" as keyof typeof leakySchema, {}),
      ),
    readInternal: () =>
      fuma.use("leaky.readInternal", async (db) => {
        const internal = (db as { readonly internal?: unknown }).internal;
        if (internal === undefined) return "hidden";
        return "visible";
      }),
    rebindContext: () =>
      fuma.use("leaky.rebindContext", async (db) => {
        const withContext = (db as { readonly withContext?: unknown }).withContext;
        if (withContext === undefined) return "hidden";
        return "visible";
      }),
    countAll: () => fuma.use("leaky.countAll", (db) => db.count("leaky_item")),
    deleteAll: () => fuma.use("leaky.deleteAll", (db) => db.deleteMany("leaky_item", {})),
    deleteAtScope: (scopeId: string) =>
      fuma.use("leaky.deleteAtScope", (db) =>
        db.deleteMany("leaky_item", { where: (b) => b("scope_id", "=", scopeId) }),
      ),
    moveAll: (scopeId: string) =>
      fuma.use("leaky.moveAll", (db) =>
        db.updateMany("leaky_item", { set: { scope_id: scopeId } }),
      ),
    moveAtScope: (targetScopeId: string, nextScopeId: string) =>
      fuma.use("leaky.moveAtScope", (db) =>
        db.updateMany("leaky_item", {
          where: (b) => b("scope_id", "=", targetScopeId),
          set: { scope_id: nextScopeId },
        }),
      ),
    renameAll: (value: string) =>
      fuma.use("leaky.renameAll", (db) => db.updateMany("leaky_item", { set: { value } })),
    renameAtScope: (scopeId: string, value: string) =>
      fuma.use("leaky.renameAtScope", (db) =>
        db.updateMany("leaky_item", {
          where: (b) => b("scope_id", "=", scopeId),
          set: { value },
        }),
      ),
    readAll: () =>
      fuma.use("leaky.readAll", (db) =>
        db.findMany("leaky_item", {
          select: ["id", "value"],
          orderBy: ["id", "asc"],
        }),
      ),
  }),
  extension: (ctx) => ctx.storage,
}))();

const unscopedSchema = {
  raw_table: table("raw_table", {
    row_id: idColumn("row_id", "varchar(255)").defaultTo$("auto"),
    id: column("id", "varchar(255)"),
  }),
};

const unscopedPlugin = definePlugin(() => ({
  id: "unscoped" as const,
  schema: unscopedSchema,
  storage: () => ({}),
}))();

const incompletePolicySchema = {
  incomplete_policy_table: table("incomplete_policy_table", {
    row_id: idColumn("row_id", "varchar(255)").defaultTo$("auto"),
    id: column("id", "varchar(255)"),
    scope_id: column("scope_id", "varchar(255)"),
  }).policy<RelayScopePolicyContext>({
    name: relayScopePolicyName,
  }),
};

const incompletePolicyPlugin = definePlugin(() => ({
  id: "incomplete-policy" as const,
  schema: incompletePolicySchema,
  storage: () => ({}),
}))();

describe("relay FumaDB scope policy", () => {
  it("rejects plugin tables without an explicit relay scope policy", () => {
    expect(() => makeTestConfig({ plugins: [unscopedPlugin] as const })).toThrow(StorageError);
  });

  it("rejects plugin tables that only copy the relay policy name", () => {
    expect(() => makeTestConfig({ plugins: [incompletePolicyPlugin] as const })).toThrow(
      StorageError,
    );
  });

  it.effect("rejects direct database handles with unscoped table maps", () =>
    Effect.gen(function* () {
      const sqlite = yield* Effect.acquireRelease(
        Effect.promise(() =>
          createSqliteTestFumaDb({
            tables: {
              ...collectTables([]),
              ...unscopedSchema,
            },
            namespace: "relay_unscoped_test",
          }),
        ),
        (db) => Effect.promise(() => db.close()).pipe(Effect.ignore),
      );

      const error = yield* createRelay({
        scopes: [innerScope],
        db: sqlite.db,
        onElicitation: "accept-all",
      }).pipe(Effect.flip);

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("missing an relay scope policy"),
      });
    }),
  );

  it.effect("rejects direct database handles that are missing plugin tables", () =>
    Effect.gen(function* () {
      const sqlite = yield* Effect.acquireRelease(
        Effect.promise(() =>
          createSqliteTestFumaDb({
            tables: collectTables([]),
            namespace: "relay_missing_table_test",
          }),
        ),
        (db) => Effect.promise(() => db.close()).pipe(Effect.ignore),
      );

      const error = yield* createRelay({
        scopes: [innerScope],
        plugins: [leakyPlugin] as const,
        db: sqlite.db,
        onElicitation: "accept-all",
      }).pipe(Effect.flip);

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("missing required table definitions"),
      });
    }),
  );

  it.effect("allows in-scope partial reads and keeps hidden scope columns invisible", () =>
    Effect.gen(function* () {
      const relay = yield* createRelay(
        makeTestConfig({
          scopes: [innerScope],
          plugins: [leakyPlugin] as const,
        }),
      );

      yield* relay.leaky.create({
        id: "visible",
        scope_id: "inner",
        value: "ok",
      });

      const rows = yield* relay.leaky.readAll();
      expect(rows).toEqual([{ id: "visible", value: "ok" }]);
      expect("scope_id" in rows[0]!).toBe(false);
    }),
  );

  it.effect("does not expose raw query internals or non-plugin tables to plugin storage", () =>
    Effect.gen(function* () {
      const relay = yield* createRelay(
        makeTestConfig({
          scopes: [innerScope],
          plugins: [leakyPlugin] as const,
        }),
      );

      expect(yield* relay.leaky.readInternal()).toBe("hidden");
      expect(yield* relay.leaky.rebindContext()).toBe("hidden");

      const error = yield* relay.leaky.readCoreTable().pipe(Effect.flip);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("not available through this storage boundary"),
      });
    }),
  );

  it.effect("scopes a buggy plugin read that forgets the scope predicate", () =>
    Effect.gen(function* () {
      const config = makeTestConfig({
        scopes: [outerScope],
        plugins: [leakyPlugin] as const,
      });
      const outerRelay = yield* createRelay(config);
      yield* outerRelay.leaky.create({
        id: "outer-only",
        scope_id: "outer",
        value: "secret",
      });

      const innerRelay = yield* createRelay({ ...config, scopes: [innerScope] });
      const rows = yield* innerRelay.leaky.readAll();

      expect(rows).toEqual([]);
    }),
  );

  it.effect("blocks out-of-scope writes before they reach the database", () =>
    Effect.gen(function* () {
      const relay = yield* createRelay(
        makeTestConfig({
          scopes: [innerScope],
          plugins: [leakyPlugin] as const,
        }),
      );

      const error = yield* relay.leaky
        .create({
          id: "bad-write",
          scope_id: "outer",
          value: "nope",
        })
        .pipe(Effect.flip);

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("outside the relay scope stack"),
      });
    }),
  );

  it.effect("requires updates to name the target scope", () =>
    Effect.gen(function* () {
      const config = makeTestConfig({
        scopes: [outerScope],
        plugins: [leakyPlugin] as const,
      });
      const outerRelay = yield* createRelay(config);
      yield* outerRelay.leaky.create({
        id: "outer-row",
        scope_id: "outer",
        value: "secret",
      });

      const innerRelay = yield* createRelay({ ...config, scopes: [innerScope] });
      yield* innerRelay.leaky.create({
        id: "inner-row",
        scope_id: "inner",
        value: "before",
      });
      const error = yield* innerRelay.leaky.renameAll("after").pipe(Effect.flip);

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("must target an explicit scope"),
      });
      yield* innerRelay.leaky.renameAtScope("inner", "after");

      expect(yield* innerRelay.leaky.readAll()).toEqual([{ id: "inner-row", value: "after" }]);
      expect(yield* outerRelay.leaky.readAll()).toEqual([{ id: "outer-row", value: "secret" }]);
    }),
  );

  it.effect("blocks update values that write rows out of the scope stack", () =>
    Effect.gen(function* () {
      const relay = yield* createRelay(
        makeTestConfig({
          scopes: [innerScope],
          plugins: [leakyPlugin] as const,
        }),
      );
      yield* relay.leaky.create({
        id: "inner-row",
        scope_id: "inner",
        value: "ok",
      });

      const error = yield* relay.leaky.moveAtScope("inner", "outer").pipe(Effect.flip);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("outside the relay scope stack"),
      });
    }),
  );

  it.effect("blocks update values that change the explicit target scope", () =>
    Effect.gen(function* () {
      const relay = yield* createRelay(
        makeTestConfig({
          scopes: [innerScope, outerScope],
          plugins: [leakyPlugin] as const,
        }),
      );
      yield* relay.leaky.create({
        id: "inner-row",
        scope_id: "inner",
        value: "ok",
      });

      const error = yield* relay.leaky.moveAtScope("inner", "outer").pipe(Effect.flip);
      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("must write the same scope"),
      });
    }),
  );

  it.effect("requires deletes to name the target scope", () =>
    Effect.gen(function* () {
      const config = makeTestConfig({
        scopes: [outerScope],
        plugins: [leakyPlugin] as const,
      });
      const outerRelay = yield* createRelay(config);
      yield* outerRelay.leaky.create({
        id: "outer-row",
        scope_id: "outer",
        value: "secret",
      });

      const innerRelay = yield* createRelay({ ...config, scopes: [innerScope] });
      yield* innerRelay.leaky.create({
        id: "inner-row",
        scope_id: "inner",
        value: "temporary",
      });
      const error = yield* innerRelay.leaky.deleteAll().pipe(Effect.flip);

      expect(error).toBeInstanceOf(StorageError);
      expect(error).toMatchObject({
        message: expect.stringContaining("must target an explicit scope"),
      });
      yield* innerRelay.leaky.deleteAtScope("inner");

      expect(yield* innerRelay.leaky.readAll()).toEqual([]);
      expect(yield* outerRelay.leaky.readAll()).toEqual([{ id: "outer-row", value: "secret" }]);
    }),
  );

  it.effect("scopes broad counts instead of counting rows outside the scope stack", () =>
    Effect.gen(function* () {
      const config = makeTestConfig({
        scopes: [outerScope],
        plugins: [leakyPlugin] as const,
      });
      const outerRelay = yield* createRelay(config);
      yield* outerRelay.leaky.create({
        id: "outer-row",
        scope_id: "outer",
        value: "secret",
      });

      const innerRelay = yield* createRelay({ ...config, scopes: [innerScope] });
      yield* innerRelay.leaky.create({
        id: "inner-row",
        scope_id: "inner",
        value: "visible",
      });
      const count = yield* innerRelay.leaky.countAll();

      expect(count).toBe(1);
    }),
  );
});
