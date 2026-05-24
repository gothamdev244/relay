import { definePlugin } from "@relay-sh/sdk/core";

import { mcpPlugin, type McpPluginOptions } from "../sdk/plugin";
import { McpGroup } from "./group";
import { McpHandlers, McpExtensionService } from "./handlers";

export { McpGroup } from "./group";
export { McpHandlers, McpExtensionService } from "./handlers";

// HTTP-augmented variant of `mcpPlugin`. The returned plugin carries
// the HTTP `routes`, `handlers`, and `extensionService` so a host can
// mount the MCP HTTP surface. Hosts that compose an `HttpApi` should
// import this. SDK-only consumers stay on `@relay-sh/plugin-mcp`
// and never load `@relay-sh/api`.
export const mcpHttpPlugin = definePlugin((options?: McpPluginOptions) => ({
  ...mcpPlugin(options),
  routes: () => McpGroup,
  handlers: () => McpHandlers,
  extensionService: McpExtensionService,
}));
