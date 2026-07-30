import { describe, expect, it } from "@effect/vitest";

import { openApiPresets } from "./presets";

describe("OpenAPI presets", () => {
  it("includes the Xquik public specification", () => {
    expect(openApiPresets).toContainEqual({
      id: "xquik",
      name: "Xquik",
      summary: "X posts, users, lists, messages, and media.",
      url: "https://xquik.com/openapi.json",
      icon: "https://xquik.com/icon.svg",
    });
  });
});
