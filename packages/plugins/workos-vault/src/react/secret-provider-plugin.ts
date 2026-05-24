import { lazy } from "react";
import type { SecretProviderPlugin } from "@relay-sh/sdk/client";

export const workosVaultSecretProviderPlugin: SecretProviderPlugin = {
  key: "workosVault",
  label: "WorkOS Vault",
  settings: lazy(() => import("./WorkOSVaultSettings")),
};
