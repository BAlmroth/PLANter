import { describe, expect, it } from "vitest";
import { typeColorStyle } from "./typeColor";
import type { Template } from "./types";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [{ key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", description: "", example: "" }],
  groupColors: [],
  relationshipTypes: [],
  allowedCombinations: [],
};

describe("typeColorStyle", () => {
  it("sets --type-color to the color of the type", () => {
    expect(typeColorStyle(template, "page")).toEqual({ "--type-color": "#2563A8" });
  });

  it("returns no style for an unknown type, so the CSS fallback is used", () => {
    expect(typeColorStyle(template, "nope")).toBeUndefined();
  });
});
