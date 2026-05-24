import { type Plugin } from "@relay-sh/sdk/core";

import {
  keychainPlugin as keychainPluginEffect,
  type KeychainExtension,
  type KeychainPluginConfig,
} from "./index";

export type { KeychainPluginConfig } from "./index";

// Explicit return type so the emitted dist/promise.d.ts references
// `import("@relay-sh/sdk/core").Plugin` rather than the Promise-surface
// root specifier (which doesn't re-export Plugin).
export const keychainPlugin = (
  config?: KeychainPluginConfig,
): Plugin<"keychain", KeychainExtension, Record<string, never>, undefined> =>
  keychainPluginEffect(config);
