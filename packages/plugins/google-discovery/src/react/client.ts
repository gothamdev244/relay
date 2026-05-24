import { createPluginAtomClient } from "@relay-sh/sdk/client";
import { getBaseUrl } from "@relay-sh/react/api/base-url";
import { GoogleDiscoveryGroup } from "../api/group";

export const GoogleDiscoveryClient = createPluginAtomClient(GoogleDiscoveryGroup, {
  baseUrl: getBaseUrl,
});
