import { existsSync } from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";
import type { RelayCliConfig } from "@relay-sh/sdk/core";

const defaultPaths = [
  "relay.config.ts",
  "relay.config.js",
  "src/relay.config.ts",
  "src/relay.config.js",
];

export const getConfig = async (opts: {
  cwd: string;
  configPath?: string;
}): Promise<RelayCliConfig | null> => {
  const { cwd, configPath } = opts;

  let resolvedPath: string | undefined;

  if (configPath) {
    resolvedPath = path.resolve(cwd, configPath);
    if (!existsSync(resolvedPath)) {
      console.error(`Config file not found: ${resolvedPath}`);
      return null;
    }
  } else {
    for (const p of defaultPaths) {
      const candidate = path.resolve(cwd, p);
      if (existsSync(candidate)) {
        resolvedPath = candidate;
        break;
      }
    }
  }

  if (!resolvedPath) return null;

  const jiti = createJiti(cwd, {
    interopDefault: true,
    moduleCache: false,
  });

  const mod = await jiti.import(resolvedPath);
  const config = (mod as { default?: RelayCliConfig }).default ?? mod;
  return config as RelayCliConfig;
};
