import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/server/relay-schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
