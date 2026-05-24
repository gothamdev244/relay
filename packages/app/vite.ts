import { fileURLToPath } from "node:url";
import type { PluginOption } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import relayVitePlugin from "@relay-sh/vite-plugin";

const APP_ROOT = fileURLToPath(new URL("./", import.meta.url));

interface AppPluginOptions {
  /**
   * Absolute path to the `relay.config.ts` whose plugin list should
   * feed `virtual:relay/plugins-client`. The Vite root for this app
   * is `packages/app/` which has no relay.config, so consumers must
   * point this at their own (typically `apps/local/relay.config.ts`).
   *
   * If omitted, no plugin UIs get bundled — the renderer still works
   * for built-in pages but Sources / Connections / etc. plugin pages
   * stay empty.
   */
  readonly relayConfigPath?: string;
  /** Absolute path to `relay.jsonc`. Optional companion to relayConfigPath. */
  readonly relayJsoncPath?: string;
}

/**
 * Vite plugin bundle for the relay React app.
 *
 * Layered into apps/local's vite config (web build) and apps/desktop's
 * electron.vite renderer config. Consumers must pass `relayConfigPath`
 * so plugin client bundles get included — see option docs above.
 *
 * Does NOT include consumer-specific defines (VITE_APP_VERSION etc.) or
 * server-side middleware (api/mcp). Consumers layer those on top.
 */
export default function appPlugin(options: AppPluginOptions = {}): PluginOption[] {
  return [
    {
      name: "relay-app:config",
      config() {
        return {
          resolve: {
            alias: {
              "@relay-app": APP_ROOT,
            },
            dedupe: ["react", "react-dom"],
          },
        };
      },
    },
    tailwindcss(),
    relayVitePlugin({
      ...(options.relayConfigPath ? { configPath: options.relayConfigPath } : {}),
      ...(options.relayJsoncPath ? { jsoncPath: options.relayJsoncPath } : {}),
    }),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: fileURLToPath(new URL("./src/routes", import.meta.url)),
      generatedRouteTree: fileURLToPath(new URL("./src/routeTree.gen.ts", import.meta.url)),
    }),
    ...react(),
  ];
}
