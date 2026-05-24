import { defineClientPlugin } from "@relay-sh/sdk/client";

import { graphqlSourcePlugin } from "./source-plugin";

export default defineClientPlugin({
  id: "graphql" as const,
  sourcePlugin: graphqlSourcePlugin,
});
