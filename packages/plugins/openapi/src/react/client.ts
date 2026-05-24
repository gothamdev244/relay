import { createPluginAtomClient } from "@relay-sh/sdk/client";
import { getBaseUrl } from "@relay-sh/react/api/base-url";
import { OpenApiGroup } from "../api/group";

export const OpenApiClient = createPluginAtomClient(OpenApiGroup, {
  baseUrl: getBaseUrl,
});
