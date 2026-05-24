import { createPluginAtomClient } from "@relay-sh/sdk/client";
import { getBaseUrl } from "@relay-sh/react/api/base-url";
import { GraphqlGroup } from "../api/group";

export const GraphqlClient = createPluginAtomClient(GraphqlGroup, {
  baseUrl: getBaseUrl,
});
