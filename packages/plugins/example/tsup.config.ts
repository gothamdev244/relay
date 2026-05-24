import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    server: "src/server.ts",
    client: "src/client.tsx",
    shared: "src/shared.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: [/^@relay-js\//, /^effect/, /^@effect\//, "react", "react/jsx-runtime"],
});
