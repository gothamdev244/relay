# @relay-sh/plugin-google-discovery

Turn any [Google Discovery API](https://developers.google.com/discovery) (Calendar, Gmail, Drive, Sheets, etc.) into a set of relay tools. Handles the discovery document, OAuth flow, and per-request token binding.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-google-discovery
# or
npm install @relay-sh/sdk @relay-sh/plugin-google-discovery
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { googleDiscoveryPlugin } from "@relay-sh/plugin-google-discovery";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [fileSecretsPlugin(), googleDiscoveryPlugin()] as const,
});

const scope = relay.scopes[0]!.id;

// Store the OAuth client credentials as secrets first — the plugin
// references them by id at sign-in time so client_id/client_secret never
// live in your config files.
await relay.secrets.set({
  id: "google-client-id",
  name: "Google OAuth Client ID",
  value: process.env.GOOGLE_CLIENT_ID!,
  scope,
});
await relay.secrets.set({
  id: "google-client-secret",
  name: "Google OAuth Client Secret",
  value: process.env.GOOGLE_CLIENT_SECRET!,
  scope,
});

// Mint a Connection through relay.connections.create(...) — usually
// done by the OAuth start/callback flow on your host. For type-safety
// here we declare a placeholder id.
declare const connectionId: string;

await relay.googleDiscovery.addSource({
  scope,
  name: "Google Calendar",
  discoveryUrl: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  namespace: "calendar",
  auth: {
    kind: "oauth2",
    connectionId,
    clientIdSecretId: "google-client-id",
    clientSecretSecretId: "google-client-secret",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
  },
});

const tools = await relay.tools.list();
```

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { googleDiscoveryPlugin } from "@relay-sh/plugin-google-discovery/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
