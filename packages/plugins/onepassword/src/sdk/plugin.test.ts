import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { ScopeId, createRelay } from "@relay-sh/sdk";
import { makeTestWorkspaceLayer, TestWorkspace } from "@relay-sh/sdk/testing";

import { onepasswordPlugin } from "./plugin";
import { OnePasswordConfig, DesktopAppAuth } from "./types";

const plugins = [onepasswordPlugin()] as const;

layer(
  makeTestWorkspaceLayer({
    plugins,
  }),
  { timeout: "15 seconds" },
)("onepassword plugin", (it) => {
  it.effect("registers onepassword as a secret provider", () =>
    Effect.gen(function* () {
      const { config: harnessConfig } = yield* TestWorkspace;
      const relay = yield* createRelay({ ...harnessConfig, plugins });
      const providers = yield* relay.secrets.providers();
      expect(providers).toContain("onepassword");
    }),
  );

  it.effect("configure / getConfig / removeConfig round-trip via blob store", () =>
    Effect.gen(function* () {
      const { config: harnessConfig } = yield* TestWorkspace;
      const relay = yield* createRelay({ ...harnessConfig, plugins });

      const initial = yield* relay.onepassword.getConfig();
      expect(initial).toBeNull();

      const config = OnePasswordConfig.make({
        auth: DesktopAppAuth.make({
          kind: "desktop-app",
          accountName: "my.1password.com",
        }),
        vaultId: "vault-123",
        name: "Personal",
      });

      yield* relay.onepassword.configure(config, ScopeId.make("test-scope"));

      const loaded = yield* relay.onepassword.getConfig();
      expect(loaded?.vaultId).toBe("vault-123");
      expect(loaded?.name).toBe("Personal");
      expect(loaded?.auth.kind).toBe("desktop-app");

      yield* relay.onepassword.removeConfig(ScopeId.make("test-scope"));
      const afterRemove = yield* relay.onepassword.getConfig();
      expect(afterRemove).toBeNull();
    }),
  );

  it.effect("status reports not-configured before configure", () =>
    Effect.gen(function* () {
      const { config: harnessConfig } = yield* TestWorkspace;
      const relay = yield* createRelay({ ...harnessConfig, plugins });
      const status = yield* relay.onepassword.status();
      expect(status.connected).toBe(false);
      expect(status.error).toBe("Not configured");
    }),
  );
});
