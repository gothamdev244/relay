import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Effect } from "effect";
import { ScopeId, ToolId } from "@relay-sh/sdk";

import { RelayApi } from "../api";
import { RelayService } from "../services";
import { capture } from "@relay-sh/api";

export const SourcesHandlers = HttpApiBuilder.group(RelayApi, "sources", (handlers) =>
  handlers
    .handle("list", () =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const sources = yield* relay.sources.list();
          return sources.map((s) => ({
            id: s.id,
            scopeId: s.scopeId ? ScopeId.make(s.scopeId) : undefined,
            name: s.name,
            kind: s.kind,
            url: s.url,
            runtime: s.runtime,
            canRemove: s.canRemove,
            canRefresh: s.canRefresh,
            canEdit: s.canEdit,
          }));
        }),
      ),
    )
    .handle("remove", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          yield* relay.sources.remove({ id: path.sourceId, targetScope: path.scopeId });
          return { removed: true };
        }),
      ),
    )
    .handle("refresh", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          yield* relay.sources.refresh({ id: path.sourceId, targetScope: path.scopeId });
          return { refreshed: true };
        }),
      ),
    )
    .handle("tools", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          // Source detail is a management view — include policy-blocked
          // tools so users can see and unblock them from the same place
          // they review the source's other tools. Annotations are loaded
          // so the UI can show the plugin's default approval state for
          // tools that have no user policy override.
          const tools = yield* relay.tools.list({
            sourceId: path.sourceId,
            includeAnnotations: true,
            includeBlocked: true,
          });
          return tools.map((t) => ({
            id: ToolId.make(t.id),
            pluginId: t.pluginId,
            sourceId: t.sourceId,
            name: t.name,
            description: t.description,
            mayElicit: t.annotations?.mayElicit,
            requiresApproval: t.annotations?.requiresApproval,
            approvalDescription: t.annotations?.approvalDescription,
          }));
        }),
      ),
    )
    .handle("detect", ({ payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const results = yield* relay.sources.detect(payload.url.trim());
          return results.map((r) => ({
            kind: r.kind,
            confidence: r.confidence,
            endpoint: r.endpoint,
            name: r.name,
            namespace: r.namespace,
          }));
        }),
      ),
    ),
);
