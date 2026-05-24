import { defineRelayConfig } from "@relay-sh/sdk";
import { openApiHttpPlugin } from "@relay-sh/plugin-openapi/api";
import { mcpHttpPlugin } from "@relay-sh/plugin-mcp/api";
import { googleDiscoveryHttpPlugin } from "@relay-sh/plugin-google-discovery/api";
import { graphqlHttpPlugin } from "@relay-sh/plugin-graphql/api";
import { keychainPlugin } from "@relay-sh/plugin-keychain";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";
import { onepasswordHttpPlugin } from "@relay-sh/plugin-onepassword/api";
import { desktopSettingsPlugin } from "@relay-sh/plugin-desktop-settings/server";

// ---------------------------------------------------------------------------
// Single source of truth for the local app's plugin list.
//
// Consumed by the host runtime. The runtime passes the merged plugin tables
// to FumaDB directly; there is no separate Relay schema-generation step.
//
// First-party and third-party plugins use the same import-and-call flow.
// ---------------------------------------------------------------------------

export default defineRelayConfig({
  plugins: () =>
    [
      openApiHttpPlugin(),
      mcpHttpPlugin({ dangerouslyAllowStdioMCP: true }),
      googleDiscoveryHttpPlugin(),
      graphqlHttpPlugin(),
      keychainPlugin(),
      fileSecretsPlugin(),
      onepasswordHttpPlugin(),
      desktopSettingsPlugin(),
    ] as const,
});
