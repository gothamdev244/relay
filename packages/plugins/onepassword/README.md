# @relay-sh/plugin-onepassword

[1Password](https://1password.com) integration for the relay. Provides a secret source that resolves values from a 1Password vault, backed by either the desktop app (connect.sock) or a service account token.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-onepassword
# or
npm install @relay-sh/sdk @relay-sh/plugin-onepassword
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { onepasswordPlugin } from "@relay-sh/plugin-onepassword";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [onepasswordPlugin()] as const,
});

// Point the plugin at your account
await relay.onepassword.configure({
  auth: { kind: "desktop-app", accountName: "my-account" },
  vaultId: "my-vault-id",
  name: "Personal",
});

// Inspect connection / list vaults
const status = await relay.onepassword.status();
const vaults = await relay.onepassword.listVaults({
  kind: "desktop-app",
  accountName: "my-account",
});
```

For CI and headless environments, use a service-account token instead of the desktop app. Store the token through the relay's secret store first, then reference it by id:

```ts
import { createRelay } from "@relay-sh/sdk";
import { onepasswordPlugin } from "@relay-sh/plugin-onepassword";
import { fileSecretsPlugin } from "@relay-sh/plugin-file-secrets";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [fileSecretsPlugin(), onepasswordPlugin()] as const,
});

await relay.secrets.set({
  id: "op-token",
  name: "1Password service account",
  value: process.env.OP_SERVICE_ACCOUNT_TOKEN!,
  scope: relay.scopes[0]!.id,
});

await relay.onepassword.configure({
  auth: { kind: "service-account", tokenSecretId: "op-token" },
  vaultId: "my-vault-id",
  name: "CI",
});
```

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { onepasswordPlugin } from "@relay-sh/plugin-onepassword/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
