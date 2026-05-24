import { lazy } from "react";
import type { SecretProviderPlugin } from "@relay-sh/sdk/client";

export const onePasswordSecretProviderPlugin: SecretProviderPlugin = {
  key: "onepassword",
  label: "1Password",
  settings: lazy(() => import("./OnePasswordSettings")),
};
