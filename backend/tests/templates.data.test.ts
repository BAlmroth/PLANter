import { describe, it, expect } from "vitest";
import { getTemplate } from "../src/templates/index.js";
import { webTemplate } from "../src/templates/web.js";

// These tests check the template data itself, so a typo in a key
// (like "componnent") fails here instead of silently never matching.
describe("web template data", () => {
  const itemKeys = webTemplate.itemTypes.map((t) => t.key);
  const relationshipKeys = webTemplate.relationshipTypes.map((t) => t.key);

  it("has unique item type keys", () => {
    expect(new Set(itemKeys).size).toBe(itemKeys.length);
  });

  it("has unique relationship type keys", () => {
    expect(new Set(relationshipKeys).size).toBe(relationshipKeys.length);
  });

  it("only uses item types that exist as source and target", () => {
    for (const c of webTemplate.allowedCombinations) {
      expect(itemKeys, `source "${c.source}"`).toContain(c.source);
      expect(itemKeys, `target "${c.target}"`).toContain(c.target);
    }
  });

  it("only uses relationship types that exist", () => {
    for (const c of webTemplate.allowedCombinations) {
      expect(relationshipKeys, `relationship "${c.relationship}"`).toContain(c.relationship);
    }
  });

  it("has no duplicate combinations", () => {
    const combos = webTemplate.allowedCombinations.map(
      (c) => `${c.source}|${c.relationship}|${c.target}`,
    );
    expect(new Set(combos).size).toBe(combos.length);
  });

  it("uses every relationship type in at least one combination", () => {
    const used = new Set(webTemplate.allowedCombinations.map((c) => c.relationship));
    for (const key of relationshipKeys) {
      expect(used.has(key), `relationship "${key}" is never used`).toBe(true);
    }
  });

  it("has a non-empty label for every item and relationship type", () => {
    for (const t of webTemplate.itemTypes) {
      expect(t.label).not.toBe("");
      expect(t.pluralLabel).not.toBe("");
    }
    for (const r of webTemplate.relationshipTypes) {
      expect(r.label).not.toBe("");
      expect(r.inverseLabel).not.toBe("");
    }
  });
});

describe("getTemplate", () => {
  it("returns the web template for 'web'", () => {
    expect(getTemplate("web")).toBe(webTemplate);
  });

  it("returns undefined for an unknown key", () => {
    expect(getTemplate("nope")).toBeUndefined();
  });

  it("returns undefined for keys on Object.prototype", () => {
    expect(getTemplate("constructor")).toBeUndefined();
    expect(getTemplate("__proto__")).toBeUndefined();
  });
});
