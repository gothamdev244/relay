import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Effect } from "effect";
import { RemoveSecretInput, SetSecretInput, type SecretRef } from "@relay-sh/sdk";

import { RelayApi } from "../api";
import { RelayService } from "../services";
import { capture } from "@relay-sh/api";

const refToResponse = (ref: SecretRef) => ({
  id: ref.id,
  scopeId: ref.scopeId,
  name: ref.name,
  provider: ref.provider,
  createdAt: ref.createdAt.getTime(),
});

export const SecretsHandlers = HttpApiBuilder.group(RelayApi, "secrets", (handlers) =>
  handlers
    .handle("list", () =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const refs = yield* relay.secrets.list();
          return refs.map(refToResponse);
        }),
      ),
    )
    .handle("listAll", () =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const refs = yield* relay.secrets.listAll();
          return refs.map(refToResponse);
        }),
      ),
    )
    .handle("status", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const status = yield* relay.secrets.status(path.secretId);
          return { secretId: path.secretId, status };
        }),
      ),
    )
    .handle("set", ({ params: path, payload }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          const ref = yield* relay.secrets.set(
            SetSecretInput.make({
              id: payload.id,
              scope: path.scopeId,
              name: payload.name,
              value: payload.value,
              provider: payload.provider,
            }),
          );
          return refToResponse(ref);
        }),
      ),
    )
    .handle("remove", ({ params: path }) =>
      capture(
        Effect.gen(function* () {
          const relay = yield* RelayService;
          yield* relay.secrets.remove(
            RemoveSecretInput.make({
              id: path.secretId,
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
          return yield* relay.secrets.usages(path.secretId);
        }),
      ),
    ),
);
