// ---------------------------------------------------------------------------
// defineRelayConfig — typed config declaration consumed by host runtimes.
// Single source of truth for the plugin list. First-party and third-party
// plugins go through the same `bun add @relay-sh/plugin-foo` +
// import-and-call flow.
//
// `plugins` is always a factory `(deps?) => readonly AnyPlugin[]`. Some
// plugins want runtime values from the host (e.g., the openapi plugin's
// `configFile` sink, which is keyed to the active scope cwd and so can't
// be constructed at module-eval time). Deps are optional — the
// packaging and static tooling call `plugins()` with no args (they read
// `plugin.schema` / `plugin.packageName` only); runtime callers pass concrete
// deps.
//
// Each app declares its own deps shape inline on the factory parameter
// — TS infers `TDeps` from there, so apps don't reach into the SDK's
// types via `declare module`.
// ---------------------------------------------------------------------------

import type { AnyPlugin } from "./plugin";

export type RelayPluginsFactory<
  TDeps extends object = object,
  TPlugins extends readonly AnyPlugin[] = readonly AnyPlugin[],
> = (deps?: TDeps) => TPlugins;

export interface RelayCliConfig<
  TDeps extends object = object,
  TPlugins extends readonly AnyPlugin[] = readonly AnyPlugin[],
> {
  readonly plugins: RelayPluginsFactory<TDeps, TPlugins>;
}

/**
 * Declare an relay config. Host runtimes import this file to instantiate
 * plugins, and static tooling can read the same plugin metadata without
 * constructing runtime credentials.
 *
 * The `const TPlugins` modifier preserves the tuple-literal inference
 * from the factory's return so per-plugin extension typing flows through
 * (`ReturnType<typeof config.plugins>` keeps `[OpenApi, Mcp, ...]`).
 *
 * `TDeps` is inferred from the factory's parameter — apps annotate
 * the destructure (e.g., `({ configFile }: { configFile?: ConfigFileSink })`)
 * directly. No global module augmentation needed.
 */
export const defineRelayConfig = <
  TDeps extends object,
  const TPlugins extends readonly AnyPlugin[],
>(
  config: RelayCliConfig<TDeps, TPlugins>,
): RelayCliConfig<TDeps, TPlugins> => config;
