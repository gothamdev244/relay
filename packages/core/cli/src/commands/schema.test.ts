import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { schema } from "./schema";

describe("schema generate", () => {
  it.effect("generates a FumaDB-backed Drizzle schema from relay config", () =>
    Effect.acquireUseRelease(
      Effect.promise(() => mkdtemp(join(tmpdir(), "relay-cli-schema-"))),
      (cwd) =>
        Effect.promise(async () => {
          await writeFile(
            join(cwd, "relay.config.js"),
            "export default { plugins: () => [] };\n",
          );

          await schema.parseAsync(
            [
              "node",
              "test",
              "generate",
              "--cwd",
              cwd,
              "--output",
              "generated/relay-schema.ts",
              "--namespace",
              "relay_cli_test",
              "--provider",
              "sqlite",
            ],
            { from: "node" },
          );

          const generated = await readFile(join(cwd, "generated/relay-schema.ts"), "utf8");
          expect(generated).toContain("relay_cli_test");
          expect(generated).toContain("source");
          expect(generated).toContain("credential_binding");
        }),
      (cwd) => Effect.promise(() => rm(cwd, { recursive: true, force: true })),
    ),
  );
});
