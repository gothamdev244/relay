# @relay-sh/plugin-mcp

Register [Model Context Protocol](https://modelcontextprotocol.io) servers as tool sources for an relay. Supports both stdio-launched servers and remote (HTTP) servers, with optional OAuth.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-mcp
# or
npm install @relay-sh/sdk @relay-sh/plugin-mcp
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { mcpPlugin } from "@relay-sh/plugin-mcp";

const relay = await createRelay({
  onElicitation: "accept-all",
  // Stdio sources spawn a local subprocess and inherit `process.env` —
  // only enable for trusted single-user contexts.
  plugins: [mcpPlugin({ dangerouslyAllowStdioMCP: true })] as const,
});

const scope = relay.scopes[0]!.id;

// Remote MCP server
await relay.mcp.addSource({
  scope,
  transport: "remote",
  name: "Context7",
  endpoint: "https://mcp.context7.com/mcp",
});

// Stdio MCP server (requires `dangerouslyAllowStdioMCP: true` above)
await relay.mcp.addSource({
  scope,
  transport: "stdio",
  name: "My Server",
  command: "npx",
  args: ["-y", "@my/mcp-server"],
});

// Every MCP tool is now part of the unified catalog
const tools = await relay.tools.list();

const result = await relay.tools.invoke("context7.searchLibraries", {
  query: "effect-ts",
});
```

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { mcpPlugin } from "@relay-sh/plugin-mcp/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
