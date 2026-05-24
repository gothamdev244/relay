import { resolve } from "node:path";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import appPlugin from "@relay-sh/app/vite";

const APP_ROOT = resolve(import.meta.dirname, "../../packages/app");
const APPS_LOCAL = resolve(import.meta.dirname, "../local");

// Electron's runtime is provided by the launcher binary, not the bundle.
// electron-log etc. ship native modules that also must stay external.
const ELECTRON_EXTERNALS = [
  "electron",
  "electron-log",
  "electron-log/main",
  "electron-store",
  "electron-updater",
  "electron-window-state",
];

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: "src/main/index.ts" },
        external: ELECTRON_EXTERNALS,
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: { index: "src/preload/index.ts" },
        external: ELECTRON_EXTERNALS,
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    root: "src/renderer",
    publicDir: resolve(APP_ROOT, "public"),
    define: {
      "import.meta.env.VITE_APP_VERSION": JSON.stringify(
        process.env.npm_package_version ?? "0.0.0",
      ),
      "import.meta.env.VITE_GITHUB_URL": JSON.stringify("https://github.com/gothamdev244/relay"),
    },
    resolve: {
      alias: {
        "@relay-app/": `${APP_ROOT}/`,
      },
      dedupe: ["react", "react-dom"],
    },
    server: {
      fs: {
        allow: [resolve(import.meta.dirname, "../..")],
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: "src/renderer/index.html",
        },
      },
    },
    plugins: [
      appPlugin({
        relayConfigPath: resolve(APPS_LOCAL, "relay.config.ts"),
        relayJsoncPath: resolve(APPS_LOCAL, "relay.jsonc"),
      }),
    ],
  },
});
