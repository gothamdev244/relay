import { createPluginAtomClient } from "@relay-sh/sdk/client";
import { getBaseUrl } from "@relay-sh/react/api/base-url";
import { McpGroup } from "../api/group";

export const McpClient = createPluginAtomClient(McpGroup, {
  baseUrl: getBaseUrl,
});
