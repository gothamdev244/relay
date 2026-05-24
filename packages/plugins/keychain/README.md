# @relay-sh/plugin-keychain

OS-keychain-backed secret store for the relay. Reads and writes secrets to:

- **macOS / iOS** — Keychain
- **Linux** — Secret Service (GNOME Keyring, KWallet)
- **Windows** — Credential Manager

Secrets are encrypted at rest by the operating system and never touch your project's filesystem.

## Install

```sh
bun add @relay-sh/sdk @relay-sh/plugin-keychain
# or
npm install @relay-sh/sdk @relay-sh/plugin-keychain
```

## Usage

```ts
import { createRelay } from "@relay-sh/sdk";
import { keychainPlugin } from "@relay-sh/plugin-keychain";

const relay = await createRelay({
  onElicitation: "accept-all",
  plugins: [keychainPlugin()] as const,
});

// Check whether the current OS has a supported keychain
if (relay.keychain.isSupported) {
  await relay.secrets.set({
    id: "github-token",
    name: "GitHub Token",
    value: "ghp_...",
    scope: relay.scopes[0]!.id,
  });

  const value = await relay.secrets.get("github-token");
}
```

Secrets written through this plugin are available to every other plugin that resolves secrets by ID — so you can store a token once and use it across `@relay-sh/plugin-openapi`, `@relay-sh/plugin-graphql`, etc. via `{ secretId, prefix }` headers.

## Using with Effect

If you're building on `@relay-sh/sdk/core` (the raw Effect entry), import this plugin from its `/core` subpath instead — it returns the Effect-shaped plugin with `Effect.Effect<...>`-returning methods rather than promisified wrappers:

```ts
import { keychainPlugin } from "@relay-sh/plugin-keychain/core";
```

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
