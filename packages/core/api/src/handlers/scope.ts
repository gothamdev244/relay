import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Effect } from "effect";

import { RelayApi } from "../api";
import { RelayService } from "../services";
import { capture } from "@relay-sh/api";

export const ScopeHandlers = HttpApiBuilder.group(RelayApi, "scope", (handlers) =>
  handlers.handle("info", () =>
    capture(
      Effect.gen(function* () {
        const relay = yield* RelayService;
        // `id` / `name` / `dir` continue to point at the outermost scope so
        // existing clients keep their source writes org/workspace-scoped.
        // `stack` exposes the full innermost-first scope stack so the UI can
        // deliberately target per-user secret writes when binding credentials.
        const scope = relay.scopes.at(-1)!;
        return {
          id: scope.id,
          name: scope.name,
          dir: scope.name,
          stack: relay.scopes.map((entry) => ({
            id: entry.id,
            name: entry.name,
            dir: entry.name,
          })),
        };
      }),
    ),
  ),
);
