// ---------------------------------------------------------------------------
// Shared execution stack — the wiring that turns an organization into a
// runnable relay + engine. Used by the protected HTTP API (per-request)
// and the MCP session DO (per-session) so changes to the stack flow to both.
// ---------------------------------------------------------------------------

import { env } from "cloudflare:workers";
import { Effect } from "effect";

import { createExecutionEngine } from "@relay-sh/execution";
import { makeDynamicWorkerRelay } from "@relay-sh/runtime-dynamic-worker";

import { withExecutionUsageTracking } from "../api/execution-usage";
import { AutumnService } from "./autumn";
import { createScopedRelay } from "./relay";

export const makeExecutionStack = (
  userId: string,
  organizationId: string,
  organizationName: string,
) =>
  Effect.gen(function* () {
    const relay = yield* createScopedRelay(userId, organizationId, organizationName).pipe(
      Effect.withSpan("McpSessionDO.createScopedRelay"),
    );
    const codeRelay = makeDynamicWorkerRelay({ loader: env.LOADER });
    const autumn = yield* AutumnService;
    const engine = withExecutionUsageTracking(
      organizationId,
      createExecutionEngine({ relay, codeRelay }),
      (orgId) => Effect.runFork(autumn.trackExecution(orgId)),
    );
    return { relay, engine };
  }).pipe(Effect.withSpan("McpSessionDO.makeExecutionStack"));
