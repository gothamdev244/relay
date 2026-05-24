# @relay-sh/codemode-core

Core primitives for "code mode" — the pattern where an LLM writes TypeScript/JavaScript that calls into a pre-registered set of tools, executed in a sandbox. This package provides the shared type surface (`Tool`, `SandboxToolInvoker`, `CodeRelay`), JSON Schema helpers, and error types used by every runtime that implements the contract.

Most callers depend on this transitively through `@relay-sh/execution` and a sandbox runtime like `@relay-sh/runtime-quickjs`. Install directly when you're authoring a new runtime.

## Install

```sh
bun add @relay-sh/codemode-core
# or
npm install @relay-sh/codemode-core
```

## Usage

Implement a runtime that satisfies `CodeRelay`:

```ts
import type { CodeRelay, ExecuteResult, SandboxToolInvoker } from "@relay-sh/codemode-core";
import { Effect } from "effect";

export const makeMyRuntime = (): CodeRelay => ({
  execute: (code: string, invoker: SandboxToolInvoker) =>
    Effect.gen(function* () {
      // Spin up your sandbox, expose `invoker` as `tools.<path>(...)`, run
      // the code, collect logs, and return an ExecuteResult.
      void code;
      void invoker;
      const result: ExecuteResult = { result: undefined, logs: [] };
      return result;
    }),
});
```

The runtime is passed a `SandboxToolInvoker` that bridges sandbox-side tool calls back to the relay. The sandbox-visible API is whatever you decide — `@relay-sh/runtime-quickjs` exposes a `tools` proxy object; a runtime targeting Cloudflare Workers might use something else.

## Status

Pre-`1.0`. APIs may still change between beta releases. Part of the [relay monorepo](https://github.com/gothamdev244/relay).

## License

MIT
