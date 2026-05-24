// ---------------------------------------------------------------------------
// Local app × MCP OAuth — real HTTP end-to-end
// ---------------------------------------------------------------------------
//
// Mirrors apps/cloud/src/services/mcp-oauth.node.test.ts but for the local
// (sqlite) server. Drives the real LocalApi (core + mcp groups) against a
// real in-process OAuth + MCP server. Every layer between the test and the
// plugin is real:
//
//   test → HttpApiClient → in-process webHandler → LocalApi
//        → McpHandlers → mcpPlugin.startOAuth / completeOAuth
//        → MCP SDK `auth()`
//        → OAuthTestServer (DCR, /authorize → login, /token, AS metadata,
//          protected resource metadata, MCP protected resource)
//
// Single-scope: local has one scope per project (`${folder}-${hash}`) so
// the OAuth flow lands tokens at that scope and `secrets.resolve` reads
// them back through the same provider (file-secrets in a tmpdir).
// ---------------------------------------------------------------------------

import { afterAll, beforeAll, describe, expect, it } from "@effect/vitest";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { HttpApi, HttpApiBuilder, HttpApiClient } from "effect/unstable/httpapi";
import { FetchHttpClient, HttpRouter, HttpServer } from "effect/unstable/http";
import { Effect, Layer } from "effect";

import { addGroup, observabilityMiddleware } from "@relay-sh/api";
import { CoreHandlers, ExecutionEngineService, RelayService } from "@relay-sh/api/server";
import { createExecutionEngine } from "@relay-sh/execution";
import { makeQuickJsRelay } from "@relay-sh/runtime-quickjs";
import { Scope, ScopeId, collectTables, createRelay } from "@relay-sh/sdk";
import { serveOAuthTestServer } from "@relay-sh/sdk/testing";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";
import { mcpPlugin } from "@relay-sh/plugin-mcp";
import { McpExtensionService, McpGroup, McpHandlers } from "@relay-sh/plugin-mcp/api";

import { ErrorCaptureLive } from "./observability";
import { createSqliteFumaDb } from "./sqlite-fumadb";

// Shape of the test API: core + mcp group, with InternalError surfaced at
// the top level so `observabilityMiddleware` can land its typed-error
// bridge on every endpoint.
const TestApi = addGroup(McpGroup);
type TestApiShape =
  typeof TestApi extends HttpApi.HttpApi<infer _Id, infer Groups>
    ? HttpApiClient.Client<Groups, never>
    : never;

// ---------------------------------------------------------------------------
// In-process local API harness — tmpdir SQLite + minimal plugin set.
// ---------------------------------------------------------------------------

const TEST_BASE_URL = "http://local.test";

interface Harness {
  readonly fetch: typeof globalThis.fetch;
  readonly scopeId: string;
  readonly dispose: () => Promise<void>;
}

const startHarness = async (tmpDir: string): Promise<Harness> => {
  const scopeId = `test-${randomBytes(4).toString("hex")}`;
  const plugins = [
    mcpPlugin({ dangerouslyAllowStdioMCP: false }),
    fileSecretsPlugin({ directory: tmpDir }),
  ] as const;
  const sqlite = await createSqliteFumaDb({
    tables: collectTables(plugins),
    namespace: "relay_local_test",
    path: join(tmpDir, "data.db"),
  });

  const scope = Scope.make({
    id: ScopeId.make(scopeId),
    name: "test",
    createdAt: new Date(),
  });

  const relay = await Effect.runPromise(
    createRelay({
      scopes: [scope],
      db: sqlite.db,
      plugins,
      onElicitation: "accept-all",
      oauthEndpointUrlPolicy: { allowHttp: true },
    }),
  );

  const engine = createExecutionEngine({
    relay,
    codeRelay: makeQuickJsRelay(),
  });

  const TestObservability = observabilityMiddleware(TestApi);

  const TestApiBase = HttpApiBuilder.layer(TestApi).pipe(
    Layer.provide(CoreHandlers),
    Layer.provide(McpHandlers),
    Layer.provide(TestObservability),
    Layer.provide(ErrorCaptureLive),
  );

  const pluginExtensions = Layer.succeed(McpExtensionService)(relay.mcp);

  const { handler: webHandler, dispose: disposeHandler } = HttpRouter.toWebHandler(
    TestApiBase.pipe(
      Layer.provideMerge(pluginExtensions),
      Layer.provideMerge(Layer.succeed(RelayService)(relay)),
      Layer.provideMerge(Layer.succeed(ExecutionEngineService)(engine)),
      Layer.provideMerge(HttpServer.layerServices),
      Layer.provideMerge(Layer.succeed(HttpRouter.RouterConfig)({ maxParamLength: 1000 })),
    ),
  );

  return {
    fetch: ((input: RequestInfo | URL, init?: RequestInit) =>
      webHandler(
        input instanceof Request ? input : new Request(input, init),
      )) as typeof globalThis.fetch,
    scopeId,
    dispose: async () => {
      await Effect.runPromise(Effect.ignore(Effect.tryPromise(() => disposeHandler())));
      await Effect.runPromise(
        Effect.ignore(Effect.tryPromise(() => Effect.runPromise(relay.close()))),
      );
      await sqlite.close();
    },
  };
};

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

let tmpDir: string;
let harness: Harness;

beforeAll(async () => {
  tmpDir = mkdtempSync(join(tmpdir(), "relay-local-mcp-"));
  harness = await startHarness(tmpDir);
});

afterAll(async () => {
  await harness.dispose();
  rmSync(tmpDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

describe("local mcp oauth (real OAuth + MCP server)", () => {
  it.effect(
    "startOAuth → authorize → completeOAuth mints a Connection at the scope",
    () =>
      Effect.scoped(
        Effect.gen(function* () {
          const oauth = yield* serveOAuthTestServer();
          const clientLayer = FetchHttpClient.layer.pipe(
            Layer.provide(Layer.succeed(FetchHttpClient.Fetch)(harness.fetch)),
          );

          const namespace = `ns_${randomBytes(4).toString("hex")}`;
          const connectionId = `mcp-oauth2-${namespace}`;
          const redirectUrl = "http://local.test/api/mcp/oauth/callback";
          const scopeId = ScopeId.make(harness.scopeId);

          const run = <A, E>(
            body: (client: TestApiShape) => Effect.Effect<A, E>,
          ): Effect.Effect<A, E> =>
            Effect.gen(function* () {
              const client = yield* HttpApiClient.make(TestApi, {
                baseUrl: TEST_BASE_URL,
              });
              return yield* body(client);
            }).pipe(Effect.provide(clientLayer)) as Effect.Effect<A, E>;

          const started = yield* run((client) =>
            client.oauth.start({
              params: { scopeId },
              payload: {
                endpoint: oauth.mcpResourceUrl,
                redirectUrl,
                connectionId,
                tokenScope: String(scopeId),
                strategy: { kind: "dynamic-dcr" },
                pluginId: "mcp",
              },
            }),
          );
          expect(started.sessionId).toMatch(/^oauth2_session_/);
          expect(started.authorizationUrl).not.toBeNull();

          const { code, state } = yield* oauth.completeAuthorizationCodeFlow({
            authorizationUrl: started.authorizationUrl!,
          });
          expect(state).toBe(started.sessionId);

          const completed = yield* run((client) =>
            client.oauth.complete({
              params: { scopeId },
              payload: { state, code },
            }),
          );
          expect(completed.connectionId).toBe(connectionId);
        }),
      ),
    30_000,
  );
});
