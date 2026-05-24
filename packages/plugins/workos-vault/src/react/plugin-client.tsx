import { defineClientPlugin } from "@relay-sh/sdk/client";

import { workosVaultSecretProviderPlugin } from "./secret-provider-plugin";

export default defineClientPlugin({
  id: "workosVault" as const,
  secretProviderPlugin: workosVaultSecretProviderPlugin,
});
