// ---------------------------------------------------------------------------
// @relay-sh/plugin-mcp/client — `defineClientPlugin` factory entry.
//
// Default-exports a factory rather than a value: at build time the
// `@relay-sh/vite-plugin` reads each plugin spec's `clientConfig`
// from `relay.config.ts` and emits `__p(<JSON.stringify(clientConfig)>)`
// into the virtual `plugins-client` module. So `allowStdio` flows from
// the server-side `mcpPlugin({ dangerouslyAllowStdioMCP })` straight
// into the bundle — no parallel client-side flag, no per-host shim,
// no runtime fetch.
// ---------------------------------------------------------------------------

import { defineClientPlugin } from "@relay-sh/sdk/client";

import { createMcpSourcePlugin } from "./source-plugin";

export interface McpClientConfig {
  /**
   * Mirrors `dangerouslyAllowStdioMCP` on the server-side plugin. When
   * false, the AddMcpSource UI hides the stdio tab and stdio presets.
   * Defaults to false — same default as the server flag.
   */
  readonly allowStdio?: boolean;
}

export default function createMcpClientPlugin(config?: McpClientConfig) {
  return defineClientPlugin({
    id: "mcp" as const,
    sourcePlugin: createMcpSourcePlugin({
      allowStdio: config?.allowStdio ?? false,
    }),
  });
}
