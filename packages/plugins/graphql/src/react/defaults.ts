import {
  emptyHttpCredentials,
  type HttpCredentialsState,
} from "@relay-sh/react/plugins/http-credentials";

export const initialGraphqlCredentials = (): HttpCredentialsState => emptyHttpCredentials();
