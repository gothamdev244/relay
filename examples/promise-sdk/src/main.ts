/**
 * Example: Promise-based relay SDK with MCP, OpenAPI, and GraphQL
 * — no Effect knowledge or database setup needed. Uses the SDK's
 * ephemeral in-memory FumaDB backend by default.
 */
import { createRelay } from "@relay-sh/sdk/promise";
import { mcpPlugin } from "@relay-sh/plugin-mcp/promise";
import { openApiPlugin } from "@relay-sh/plugin-openapi/promise";
import { graphqlPlugin } from "@relay-sh/plugin-graphql/promise";

// ---------------------------------------------------------------------------
// 1. Create the relay with all plugins
// ---------------------------------------------------------------------------

const plugins = [mcpPlugin(), openApiPlugin(), graphqlPlugin()] as const;

const relay = await createRelay({
  scopes: [{ id: "my-app", name: "my-app" }],
  plugins,
  onElicitation: "accept-all",
});

// ---------------------------------------------------------------------------
// 2. MCP — connect to remote or local servers
// ---------------------------------------------------------------------------

await relay.mcp.addSource({
  transport: "remote",
  name: "Context7",
  endpoint: "https://mcp.context7.com/mcp",
  scope: "my-app",
});

// Stdio server
// await relay.mcp.addSource({
//   transport: "stdio",
//   name: "My Server",
//   command: "npx",
//   args: ["-y", "@my/mcp-server"],
// });

// ---------------------------------------------------------------------------
// 3. OpenAPI — load specs by URL
// ---------------------------------------------------------------------------

await relay.openapi.addSpec({
  spec: "https://petstore3.swagger.io/api/v3/openapi.json",
  namespace: "petstore",
  scope: "my-app",
});

// With auth headers (static or secret-backed)
// await relay.secrets.set(
//   new SetSecretInput({ id: "stripe-key", name: "Stripe Key", value: "sk_live_..." }),
// );
// await relay.openapi.addSpec({
//   spec: "https://raw.githubusercontent.com/.../stripe.json",
//   namespace: "stripe",
//   headers: {
//     Authorization: { secretId: "stripe-key", prefix: "Bearer " },
//   },
// });

// ---------------------------------------------------------------------------
// 4. GraphQL — introspect endpoints
// ---------------------------------------------------------------------------

await relay.graphql.addSource({
  endpoint: "https://graphql.anilist.co",
  namespace: "anilist",
  scope: "my-app",
});

// ---------------------------------------------------------------------------
// 5. Unified tool catalog — all plugins, one list
// ---------------------------------------------------------------------------

const tools = await relay.tools.list();
console.log(`\n${tools.length} tools across all plugins:`);
for (const t of tools) {
  console.log(`  [${t.pluginId}] ${t.id} — ${t.description}`);
}

const firstPetstoreTool = tools.find((t) => t.sourceId === "petstore");
if (firstPetstoreTool) {
  const schema = await relay.tools.schema(firstPetstoreTool.id);
  console.log(`\n${firstPetstoreTool.name} input: ${schema?.inputTypeScript ?? "<none>"}`);
}

// ---------------------------------------------------------------------------
// 6. Invoke tools — same interface regardless of plugin
// ---------------------------------------------------------------------------

const anilistTool = tools.find((t) => t.sourceId === "anilist");
if (anilistTool) {
  const result = await relay.tools.invoke(anilistTool.id, {});
  console.log("\nResult:", result);
}

// ---------------------------------------------------------------------------
// 7. Secrets — shared across all plugins
// ---------------------------------------------------------------------------

await relay.secrets.set({
  id: "api-key",
  scope: "my-app",
  name: "Shared API Key",
  value: "sk_...",
});

const resolved = await relay.secrets.get("api-key");
console.log("Secret:", resolved);

await relay.close();
