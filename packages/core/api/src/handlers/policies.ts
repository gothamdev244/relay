import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Effect } from "effect";
import type { ToolPolicy } from "@relay-sh/sdk";

import { RelayApi } from "../api";
import { RelayService } from "../services";
import { capture } from "@relay-sh/api";

const policyToResponse = (p: ToolPolicy) => ({
  id: p.id,
  scopeId: p.scopeId,
  pattern: p.pattern,
  action: p.action,
  position: p.position,
  createdAt: p.createdAt.getTime(),
  updatedAt: p.updatedAt.getTime(),
});

export const PoliciesHandlers = HttpApiBuilder.group(RelayApi, "policies", (handlers) =>
  handlers
    .handle("list", () =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const policies = yield* relay.policies.list();
          return policies.map(policyToResponse);
        }),
      ),
    )
    .handle("create", ({ payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const created = yield* relay.policies.create({
            targetScope: payload.targetScope,
            pattern: payload.pattern,
            action: payload.action,
            position: payload.position,
          });
          return policyToResponse(created);
        }),
      ),
    )
    .handle("update", ({ params: path, payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const updated = yield* relay.policies.update({
            id: path.policyId,
            targetScope: payload.targetScope,
            pattern: payload.pattern,
            action: payload.action,
            position: payload.position,
          });
          return policyToResponse(updated);
        }),
      ),
    )
    .handle("remove", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          yield* relay.policies.remove({ id: path.policyId, targetScope: path.scopeId });
          return { removed: true };
        }),
      ),
    ),
);
