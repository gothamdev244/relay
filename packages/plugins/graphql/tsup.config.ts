import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/promise.ts",
    core: "src/sdk/index.ts",
    client: "src/react/plugin-client.tsx",
    testing: "src/testing/index.ts",
  },
  format: ["esm"],
  dts: false,
  sourcemap: true,
  clean: true,
  external: [/^@relay-js\//, /^effect/, /^@effect\//, /^graphql/, /^graphql-yoga/],
});
