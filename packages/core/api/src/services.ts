import { Context } from "effect";
import type * as Cause from "effect/Cause";
import type { Relay } from "@relay-sh/sdk";
import type { ExecutionEngine } from "@relay-sh/execution";

export class RelayService extends Context.Service<RelayService, Relay>()("RelayService") {}

// Error channel widened to `Cause.YieldableError` so callers that plug
// in a runtime-specific tagged error (e.g.
// `ExecutionEngine<DynamicWorkerExecutionError>`) assign structurally.
// Handlers yield directly; defects flow through `Effect.catchAllCause`
// at the edge.
export class ExecutionEngineService extends Context.Service<
  ExecutionEngineService,
  ExecutionEngine<Cause.YieldableError>
>()("ExecutionEngineService") {}
