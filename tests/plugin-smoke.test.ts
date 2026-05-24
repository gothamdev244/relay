import { describe, expect, it } from "@effect/vitest";

import { openApiPlugin } from "../packages/plugins/openapi/src/sdk/plugin";
import { mcpPlugin } from "../packages/plugins/mcp/src/sdk/plugin";
import { graphqlPlugin } from "../packages/plugins/graphql/src/sdk/plugin";
import { googleDiscoveryPlugin } from "../packages/plugins/google-discovery/src/sdk/plugin";
import { fileSecretsPlugin } from "../packages/plugins/file-secrets/src/index";
import { keychainPlugin } from "../packages/plugins/keychain/src/index";
import { examplePlugin } from "../packages/plugins/example/src/server";

// ---------------------------------------------------------------------------
// Plugin integration smoke tests
//
// Each plugin factory is called with default options and the resulting
// definition object is checked for the expected shape: `id` (string),
// `storage` (function), and the lifecycle hooks every plugin must expose.
// No external services are contacted — this only verifies that each
// module loads and produces a well-shaped plugin definition.
// ---------------------------------------------------------------------------

describe("plugin smoke tests", () => {
  // -------------------------------------------------------------------------
  // @relay-sh/plugin-openapi
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-openapi", () => {
    const plugin = openApiPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("openapi");
    });

    it("declares packageName", () => {
      expect(plugin.packageName).toBe("@relay-sh/plugin-openapi");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has invokeTool", () => {
      expect(typeof plugin.invokeTool).toBe("function");
    });

    it("has detect", () => {
      expect(typeof plugin.detect).toBe("function");
    });

    it("has staticSources", () => {
      expect(typeof plugin.staticSources).toBe("function");
    });

    it("has resolveAnnotations", () => {
      expect(typeof plugin.resolveAnnotations).toBe("function");
    });

    it("has removeSource", () => {
      expect(typeof plugin.removeSource).toBe("function");
    });

    it("has usagesForSecret", () => {
      expect(typeof plugin.usagesForSecret).toBe("function");
    });

    it("has usagesForConnection", () => {
      expect(typeof plugin.usagesForConnection).toBe("function");
    });

    it("has refreshSource", () => {
      expect(typeof plugin.refreshSource).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-mcp
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-mcp", () => {
    const plugin = mcpPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("mcp");
    });

    it("declares packageName", () => {
      expect(plugin.packageName).toBe("@relay-sh/plugin-mcp");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has invokeTool", () => {
      expect(typeof plugin.invokeTool).toBe("function");
    });

    it("has detect", () => {
      expect(typeof plugin.detect).toBe("function");
    });

    it("has resolveAnnotations", () => {
      expect(typeof plugin.resolveAnnotations).toBe("function");
    });

    it("has removeSource", () => {
      expect(typeof plugin.removeSource).toBe("function");
    });

    it("has close", () => {
      expect(typeof plugin.close).toBe("function");
    });

    it("exposes clientConfig with allowStdio", () => {
      expect(plugin.clientConfig).toBeDefined();
      expect(plugin.clientConfig.allowStdio).toBe(false);
    });

    it("respects dangerouslyAllowStdioMCP option", () => {
      const stdioPlugin = mcpPlugin({ dangerouslyAllowStdioMCP: true });
      expect(stdioPlugin.clientConfig.allowStdio).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-graphql
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-graphql", () => {
    const plugin = graphqlPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("graphql");
    });

    it("declares packageName", () => {
      expect(plugin.packageName).toBe("@relay-sh/plugin-graphql");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has invokeTool", () => {
      expect(typeof plugin.invokeTool).toBe("function");
    });

    it("has detect", () => {
      expect(typeof plugin.detect).toBe("function");
    });

    it("has staticSources", () => {
      expect(typeof plugin.staticSources).toBe("function");
    });

    it("has resolveAnnotations", () => {
      expect(typeof plugin.resolveAnnotations).toBe("function");
    });

    it("has removeSource", () => {
      expect(typeof plugin.removeSource).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-google-discovery
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-google-discovery", () => {
    const plugin = googleDiscoveryPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("googleDiscovery");
    });

    it("declares packageName", () => {
      expect(plugin.packageName).toBe("@relay-sh/plugin-google-discovery");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has invokeTool", () => {
      expect(typeof plugin.invokeTool).toBe("function");
    });

    it("has detect", () => {
      expect(typeof plugin.detect).toBe("function");
    });

    it("has resolveAnnotations", () => {
      expect(typeof plugin.resolveAnnotations).toBe("function");
    });

    it("has removeSource", () => {
      expect(typeof plugin.removeSource).toBe("function");
    });

    it("has refreshSource", () => {
      expect(typeof plugin.refreshSource).toBe("function");
    });

    it("has usagesForSecret", () => {
      expect(typeof plugin.usagesForSecret).toBe("function");
    });

    it("has usagesForConnection", () => {
      expect(typeof plugin.usagesForConnection).toBe("function");
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-file-secrets
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-file-secrets", () => {
    const plugin = fileSecretsPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("fileSecrets");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has secretProviders", () => {
      expect(typeof plugin.secretProviders).toBe("function");
    });

    it("storage returns an empty object", () => {
      const store = plugin.storage();
      expect(store).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-keychain
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-keychain", () => {
    const plugin = keychainPlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("keychain");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has secretProviders", () => {
      expect(typeof plugin.secretProviders).toBe("function");
    });

    it("storage returns an empty object", () => {
      const store = plugin.storage();
      expect(store).toEqual({});
    });
  });

  // -------------------------------------------------------------------------
  // @relay-sh/plugin-example
  // -------------------------------------------------------------------------

  describe("@relay-sh/plugin-example", () => {
    const plugin = examplePlugin();

    it("has the expected id", () => {
      expect(plugin.id).toBe("example");
    });

    it("declares packageName", () => {
      expect(plugin.packageName).toBe("@relay-sh/plugin-example");
    });

    it("has a storage factory", () => {
      expect(typeof plugin.storage).toBe("function");
    });

    it("has an extension factory", () => {
      expect(typeof plugin.extension).toBe("function");
    });

    it("has routes", () => {
      expect(typeof plugin.routes).toBe("function");
    });

    it("has handlers", () => {
      expect(typeof plugin.handlers).toBe("function");
    });

    it("has extensionService", () => {
      expect(plugin.extensionService).toBeDefined();
    });

    it("storage initializes a counter", () => {
      const store = plugin.storage();
      expect(store).toEqual({ count: 0 });
    });
  });
});
