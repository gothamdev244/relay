import { defineClientPlugin } from "@relay-sh/sdk/client";

import { googleDiscoverySourcePlugin } from "./source-plugin";

export default defineClientPlugin({
  id: "googleDiscovery" as const,
  sourcePlugin: googleDiscoverySourcePlugin,
});
