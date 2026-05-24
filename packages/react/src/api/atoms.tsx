import {
  PolicyId,
  type ConnectionId,
  type ScopeId,
  type SecretId,
  type ToolId,
} from "@relay-sh/sdk/shared";
import * as Atom from "effect/unstable/reactivity/Atom";
import * as AsyncResult from "effect/unstable/reactivity/AsyncResult";

import { RelayApiClient } from "./client";
import { ReactivityKey } from "./reactivity-keys";

// ---------------------------------------------------------------------------
// Scope — fetched from the server
// ---------------------------------------------------------------------------

export const scopeAtom = RelayApiClient.query("scope", "info", {
  timeToLive: "5 minutes",
  reactivityKeys: [ReactivityKey.scope],
});

// ---------------------------------------------------------------------------
// Query atoms — typed, cached, reactive
// ---------------------------------------------------------------------------

export const toolsAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("tools", "list", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.tools],
  });

/** Tools for a specific source */
export const sourceToolsAtom = (sourceId: string, scopeId: ScopeId) =>
  RelayApiClient.query("sources", "tools", {
    params: { scopeId, sourceId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.tools],
  });

export const toolSchemaAtom = (scopeId: ScopeId, toolId: ToolId) =>
  RelayApiClient.query("tools", "schema", {
    params: { scopeId, toolId },
    timeToLive: "1 minute",
    reactivityKeys: [ReactivityKey.tools],
  });

export const sourcesAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("sources", "list", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.sources],
  });

/** Single source by id — derived from the sources list */
export const sourceAtom = (sourceId: string, scopeId: ScopeId) =>
  Atom.mapResult(
    sourcesOptimisticAtom(scopeId),
    (sources) => sources.find((s) => s.id === sourceId) ?? null,
  );

export const secretsAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("secrets", "list", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.secrets],
  });

export const allSecretsAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("secrets", "listAll", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.secrets],
  });

export const secretStatusAtom = (scopeId: ScopeId, secretId: SecretId) =>
  RelayApiClient.query("secrets", "status", {
    params: { scopeId, secretId },
    timeToLive: "15 seconds",
    reactivityKeys: [ReactivityKey.secrets],
  });

export const connectionsAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("connections", "list", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.connections],
  });

export const secretUsagesAtom = (scopeId: ScopeId, secretId: SecretId) =>
  RelayApiClient.query("secrets", "usages", {
    params: { scopeId, secretId },
    timeToLive: "30 seconds",
    // Refresh whenever any source / connection / secret changes — adding
    // an oauth source pulls in a new connection-secret link and we want
    // the usage list to reflect it.
    reactivityKeys: [ReactivityKey.secrets, ReactivityKey.sources, ReactivityKey.connections],
  });

export const connectionUsagesAtom = (scopeId: ScopeId, connectionId: ConnectionId) =>
  RelayApiClient.query("connections", "usages", {
    params: { scopeId, connectionId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.connections, ReactivityKey.sources, ReactivityKey.secrets],
  });

export const policiesAtom = (scopeId: ScopeId) =>
  RelayApiClient.query("policies", "list", {
    params: { scopeId },
    timeToLive: "30 seconds",
    reactivityKeys: [ReactivityKey.policies],
  });

// ---------------------------------------------------------------------------
// Mutation atoms — reactivityKeys must be passed at call site (effect-atom
// does not accept them at definition time). See `reactivity-keys.tsx` for the
// canonical key arrays.
// ---------------------------------------------------------------------------

export const setSecret = RelayApiClient.mutation("secrets", "set");

export const removeSecret = RelayApiClient.mutation("secrets", "remove");

export const removeConnection = RelayApiClient.mutation("connections", "remove");

export const removeSource = RelayApiClient.mutation("sources", "remove");

export const refreshSource = RelayApiClient.mutation("sources", "refresh");

export const detectSource = RelayApiClient.mutation("sources", "detect");

// ---------------------------------------------------------------------------
// OAuth — one atom pair drives sign-in for every plugin. The plugin's
// `Add*Source` / `*SignInButton` component passes the `strategy` descriptor
// (dynamic-dcr for MCP/GraphQL, authorization-code for OpenAPI/Google,
// client-credentials for server-to-server openapi) in the start payload;
// the server looks the plugin_id up on the session row at callback time.
// ---------------------------------------------------------------------------

export const probeOAuth = RelayApiClient.mutation("oauth", "probe");

export const startOAuth = RelayApiClient.mutation("oauth", "start");

export const completeOAuth = RelayApiClient.mutation("oauth", "complete");

export const cancelOAuth = RelayApiClient.mutation("oauth", "cancel");

export const createPolicy = RelayApiClient.mutation("policies", "create");

export const updatePolicy = RelayApiClient.mutation("policies", "update");

export const removePolicy = RelayApiClient.mutation("policies", "remove");

// ---------------------------------------------------------------------------
// Sources — optimistic surface.
// ---------------------------------------------------------------------------

export const sourcesOptimisticAtom = Atom.family((scopeId: ScopeId) =>
  Atom.optimistic(sourcesAtom(scopeId)),
);

export const removeSourceOptimistic = Atom.family((scopeId: ScopeId) =>
  sourcesOptimisticAtom(scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) =>
          rows.filter((source) => source.id !== arg.params.sourceId),
        ),
      fn: removeSource,
    }),
  ),
);

// ---------------------------------------------------------------------------
// Connections — optimistic removals.
// ---------------------------------------------------------------------------

export const connectionsOptimisticAtom = Atom.family((scopeId: ScopeId) =>
  Atom.optimistic(connectionsAtom(scopeId)),
);

export const removeConnectionOptimistic = Atom.family((scopeId: ScopeId) =>
  connectionsOptimisticAtom(scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) =>
          rows.filter(
            (connection) =>
              connection.id !== arg.params.connectionId ||
              connection.scopeId !== arg.params.scopeId,
          ),
        ),
      fn: removeConnection,
    }),
  ),
);

// ---------------------------------------------------------------------------
// Secrets — optimistic removals.
// ---------------------------------------------------------------------------

export const secretsOptimisticAtom = Atom.family((scopeId: ScopeId) =>
  Atom.optimistic(secretsAtom(scopeId)),
);

export const removeSecretOptimistic = Atom.family((scopeId: ScopeId) =>
  secretsOptimisticAtom(scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) =>
          rows.filter((secret) => secret.id !== arg.params.secretId),
        ),
      fn: removeSecret,
    }),
  ),
);

// ---------------------------------------------------------------------------
// Policies — optimistic surface. Reads go through `policiesOptimisticAtom`
// (which layers in-flight transitions on top of `policiesAtom`), and writes
// go through the matching `*PolicyOptimistic` mutation atoms. Each mutation
// declares a reducer that produces the next array of rows; effect-atom's
// `Atom.optimisticFn` handles transition tracking, waiting state, and the
// post-commit refresh — including racing calls (latest reducer wins).
// ---------------------------------------------------------------------------

export const policiesOptimisticAtom = Atom.family((scopeId: ScopeId) =>
  Atom.optimistic(policiesAtom(scopeId)),
);

export const createPolicyOptimistic = Atom.family((scopeId: ScopeId) =>
  policiesOptimisticAtom(scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) => [
          {
            id: PolicyId.make(`pending-${Math.random().toString(36).slice(2)}`),
            scopeId: arg.payload.targetScope,
            pattern: arg.payload.pattern,
            action: arg.payload.action,
            // Empty string sorts before any fractional-indexing key, so
            // the placeholder lands at the top until the server returns
            // the canonical key.
            position: "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          ...rows,
        ]),
      fn: createPolicy,
    }),
  ),
);

export const updatePolicyOptimistic = Atom.family((_scopeId: ScopeId) =>
  policiesOptimisticAtom(_scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) =>
          rows.map((r) =>
            r.id === arg.params.policyId
              ? {
                  ...r,
                  ...(arg.payload.action !== undefined ? { action: arg.payload.action } : {}),
                  ...(arg.payload.pattern !== undefined ? { pattern: arg.payload.pattern } : {}),
                  ...(arg.payload.position !== undefined ? { position: arg.payload.position } : {}),
                }
              : r,
          ),
        ),
      fn: updatePolicy,
    }),
  ),
);

export const removePolicyOptimistic = Atom.family((scopeId: ScopeId) =>
  policiesOptimisticAtom(scopeId).pipe(
    Atom.optimisticFn({
      reducer: (current, arg) =>
        AsyncResult.map(current, (rows) => rows.filter((r) => r.id !== arg.params.policyId)),
      fn: removePolicy,
    }),
  ),
);
