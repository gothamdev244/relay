# @relay-sh/plugin-file-secrets

File-backed secret store for the relay. Persists secrets to a single JSON file at an XDG-compliant path so they survive between process restarts — useful for local development, CLIs, and scripts where a system keychain isn't available.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-file-secrets
# or
npm install @relay-sh/sdk @relay-sh/plugin-file-secrets
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [fileSecretsPlugin()] as const,
});

// Write a secret — persisted to the backing file
await relay.secrets.set({
  id: "api-key",
  name: "My API Key",
  value: "secret123",
  scope: relay.scopes[0]!.id,
});

// Read it back
const value = await relay.secrets.get("api-key");

// Check where it's stored
console.log("Secret file:", relay.fileSecrets.filePath);
```

Secrets written through `relay.secrets.set(...)` become available to every other plugin that resolves them, so you can (for example) store a GitHub token here and have `@relay-sh/plugin-openapi` or `@relay-sh/plugin-graphql` pick it up via `{ secretId, prefix }` headers.

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets/core";
```

## Security note

Secrets are stored unencrypted in a plain JSON file. Use [`@relay-sh/plugin-keychain`](https://www.npmjs.com/package/@relay-sh/plugin-keychain) for OS-keychain-backed storage, or [`@relay-sh/plugin-onepassword`](https://www.npmjs.com/package/@relay-sh/plugin-onepassword) for 1Password-backed storage when you need encryption at rest.

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
