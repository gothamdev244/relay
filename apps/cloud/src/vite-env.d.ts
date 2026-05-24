/// <reference types="vite/client" />

declare module "virtual:relay/plugins-client" {
  import type { ClientPluginSpec } from "@relay-sh/sdk/client";
  export const plugins: readonly ClientPluginSpec[];
}
