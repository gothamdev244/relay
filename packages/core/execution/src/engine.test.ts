import { describe, expect, it } from "@effect/vitest";
import { Data, Effect, Exit } from "effect";

import { createRelay, definePlugin } from "@relay-sh/sdk";
import { makeTestConfig } from "@relay-sh/sdk/testing";
import type { CodeRelay, ExecuteResult } from "@relay-sh/codemode-core";

import { createExecutionEngine } from "./engine";

// Regression for the hang reported as the relay-MCP "180s timeout" against
// Cowork (Claude web). Cowork goes down the `executeWithPause` branch because
// it doesn't advertise managed elicitation. When the dynamic worker fails
// fast (e.g. user submits TS with a `:` type annotation, "Unexpected token
// ':'" inside ~25ms), the failure was swallowed and the request hung until
// the client gave up at 180s. The cause was `Effect.race` having
// prefer-success semantics in Effect v4: the racing pause-signal Deferred
// never resolves, so a fiber failure is never observed by the racer.

class FakeRuntimeError extends Data.TaggedError("FakeRuntimeError")<{
  readonly message: string;
}> {}

const failingRelay: CodeRelay<FakeRuntimeError> = {
  execute: () => Effect.fail(new FakeRuntimeError({ message: "Unexpected token ':'" })),
};

const succeedingRelay: CodeRelay<FakeRuntimeError> = {
  execute: () => Effect.succeed({ result: "ok", logs: [] } satisfies ExecuteResult),
};

const emptyPlugin = definePlugin(() => ({
  id: "empty-test" as const,
  storage: () => ({}),
  staticSources: () => [],
}));

const makeRelay = () => createRelay(makeTestConfig({ plugins: [emptyPlugin()] as const }));

describe("executeWithPause failure propagation", () => {
  it.effect("surfaces a fast codeRelay failure as an Exit.Failure", () =>
    Effect.gen(function* () {
      const relay = yield* makeRelay();
      const engine = createExecutionEngine({
        relay,
        codeRelay: failingRelay,
      });

      const exit = yield* Effect.exit(engine.executeWithPause("noop"));
      expect(Exit.isFailure(exit)).toBe(true);
    }),
  );

  it.effect("does not hang when codeRelay fails", () =>
    Effect.gen(function* () {
      const relay = yield* makeRelay();
      const engine = createExecutionEngine({
        relay,
        codeRelay: failingRelay,
      });

      // Race the executeWithPause against a short sleep. With the bug
      // present this resolves to "hung" because the failure is swallowed
      // by the prefer-success race against the pause Deferred.
      const outcome = yield* Effect.race(
        Effect.exit(engine.executeWithPause("noop")).pipe(
          Effect.map((exit) => ({ kind: "settled" as const, exit })),
        ),
        Effect.sleep("500 millis").pipe(Effect.as({ kind: "hung" as const })),
      );

      expect(outcome.kind).toBe("settled");
    }),
  );

  it.effect("control: succeedingRelay returns completed", () =>
    Effect.gen(function* () {
      const relay = yield* makeRelay();
      const engine = createExecutionEngine({
        relay,
        codeRelay: succeedingRelay,
      });

      const result = yield* engine.executeWithPause("noop");
      expect(result.status).toBe("completed");
    }),
  );
});
