# @relay-sh/plugin-openapi

Load [OpenAPI](https://www.openapis.org/) specifications into an relay. Every operation in the spec becomes an invokable tool with a JSON-Schema input, automatic request building, and optional secret-backed auth.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-openapi
# or
npm install @relay-sh/sdk @relay-sh/plugin-openapi
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { openApiPlugin } from "@relay-sh/plugin-openapi";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [openApiPlugin()] as const,
});

// Load a spec by URL (JSON or YAML, remote or file://)
await relay.openapi.addSpec({
  scope: relay.scopes[0]!.id,
  spec: "https://petstore3.swagger.io/api/v3/openapi.json",
  namespace: "petstore",
});

// List and invoke tools like any other plugin
const tools = await relay.tools.list();
const result = await relay.tools.invoke("petstore.listPets", {});
```

## Secret-backed auth headers

Wire API keys or bearer tokens through the relay's secret store — never hard-code them in source configs:

```ts
import { createRelay } from "@relay-sh/sdk";
import { openApiPlugin } from "@relay-sh/plugin-openapi";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [fileSecretsPlugin(), openApiPlugin()] as const,
});

const scope = relay.scopes[0]!.id;

await relay.secrets.set({
  id: "stripe-key",
  name: "Stripe Key",
  value: "sk_live_...",
  scope,
});

await relay.openapi.addSpec({
  scope,
  spec: "https://raw.githubusercontent.com/stripe/openapi/master/openapi/spec3.json",
  namespace: "stripe",
  headers: {
    Authorization: { secretId: "stripe-key", prefix: "Bearer " },
  },
});
```

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { openApiPlugin } from "@relay-sh/plugin-openapi/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
