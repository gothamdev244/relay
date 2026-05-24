import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Effect } from "effect";

import { capture } from "@relay-sh/api";
import { RemoveConnectionInput, type ConnectionRef } from "@relay-sh/sdk";

import { RelayApi } from "../api";
import { RelayService } from "../services";

const refToResponse = (ref: ConnectionRef) => ({
  id: ref.id,
  scopeId: ref.scopeId,
  provider: ref.provider,
  identityLabel: ref.identityLabel,
  expiresAt: ref.expiresAt,
  oauthScope: ref.oauthScope,
  createdAt: ref.createdAt.getTime(),
  updatedAt: ref.updatedAt.getTime(),
});

export const ConnectionsHandlers = HttpApiBuilder.group(RelayApi, "connections", (handlers) =>
  handlers
    .handle("list", () =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const refs = yield* relay.connections.list();
          return refs.map(refToResponse);
        }),
      ),
    )
    .handle("remove", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          yield* relay.connections.remove(
            RemoveConnectionInput.make({
              id: path.connectionId,
              targetScope: path.scopeId,
            }),
          );
          return { removed: true };
        }),
      ),
    )
    .handle("usages", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          return yield* relay.connections.usages(path.connectionId);
        }),
      ),
    ),
);
