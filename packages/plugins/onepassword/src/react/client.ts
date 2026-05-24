import { createPluginAtomClient } from "@relay-sh/sdk/client";
import { getBaseUrl } from "@relay-sh/react/api/base-url";
import { OnePasswordGroup } from "../api/group";

export const OnePasswordClient = createPluginAtomClient(OnePasswordGroup, {
  baseUrl: getBaseUrl,
});
