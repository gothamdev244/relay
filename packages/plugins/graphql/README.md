# @relay-sh/plugin-graphql

Introspect a GraphQL endpoint and expose its queries and mutations as invokable tools on an relay.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-graphql
# or
npm install @relay-sh/sdk @relay-sh/plugin-graphql
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { graphqlPlugin } from "@relay-sh/plugin-graphql";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [graphqlPlugin()] as const,
});

// Public endpoint — no auth
await relay.graphql.addSource({
  scope: relay.scopes[0]!.id,
  endpoint: "https://graphql.anilist.co",
  namespace: "anilist",
});

const tools = await relay.tools.list();
const result = await relay.tools.invoke("anilist.Media", {
  search: "Frieren",
});
```

## Secret-backed auth

```ts
import { createRelay } from "@relay-sh/sdk";
import { graphqlPlugin } from "@relay-sh/plugin-graphql";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [fileSecretsPlugin(), graphqlPlugin()] as const,
});

const scope = relay.scopes[0]!.id;

await relay.secrets.set({
  id: "github-token",
  name: "GitHub Token",
  value: "ghp_...",
  scope,
});

await relay.graphql.addSource({
  scope,
  endpoint: "https://api.github.com/graphql",
  namespace: "github",
  headers: {
    Authorization: { secretId: "github-token", prefix: "Bearer " },
  },
});
```

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { graphqlPlugin } from "@relay-sh/plugin-graphql/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
