import { describe, expect, it } from "@effect/vitest";

import type { ParsedDocument } from "./parse";
import { DocResolver } from "./openapi-utils";

const document = {
  openapi: "3.1.0",
  info: {
    title: "Escaped references",
    version: "1.0.0",
  },
  paths: {},
  components: {
    schemas: {
      "slash/name": { type: "string" },
      "tilde~name": { type: "number" },
      "space name": { type: "boolean" },
    },
  },
} as ParsedDocument;

describe("DocResolver", () => {
  it("decodes JSON Pointer and URI fragment escapes", () => {
    const resolver = new DocResolver(document);

    expect(resolver.resolve({ $ref: "#/components/schemas/slash~1name" })).toEqual({
      type: "string",
    });
    expect(resolver.resolve({ $ref: "#/components/schemas/tilde~0name" })).toEqual({
      type: "number",
    });
    expect(resolver.resolve({ $ref: "#/components/schemas/space%20name" })).toEqual({
      type: "boolean",
    });
    expect(resolver.resolve({ $ref: "#/components/schemas/invalid%" })).toBeNull();
    expect(resolver.resolve({ $ref: "#/components/schemas/__proto__" })).toBeNull();
  });
});
