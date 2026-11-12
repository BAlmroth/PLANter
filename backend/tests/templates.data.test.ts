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

  it("never uses the same phrase for two connections", () => {
    // "used by" on two types made the map ambiguous: which connection is it?
    const phrases = webTemplate.relationshipTypes.flatMap((r) => [r.label, r.inverseLabel]);
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  it("has help text for every item and relationship type", () => {
    // Beginners rely on these, so an empty one would show a blank help line
    for (const t of webTemplate.itemTypes) {
      expect(t.description.trim(), `description of "${t.key}"`).not.toBe("");
      expect(t.example.trim(), `example of "${t.key}"`).not.toBe("");
    }
    for (const r of webTemplate.relationshipTypes) {
      expect(r.description.trim(), `description of "${r.key}"`).not.toBe("");
    }
  });

  it("has a #RRGGBB color for every item type", () => {
    // The color ends up in a style attribute, so it must be a plain hex color
    for (const t of webTemplate.itemTypes) {
      expect(t.color, `color of "${t.key}"`).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("has a different color for every item type", () => {
    const colors = webTemplate.itemTypes.map((t) => t.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("has unique #RRGGBB group colors that are not item type colors", () => {
    const typeColors = webTemplate.itemTypes.map((t) => t.color);
    expect(webTemplate.groupColors.length).toBeGreaterThan(0);
    expect(new Set(webTemplate.groupColors).size).toBe(webTemplate.groupColors.length);
    for (const color of webTemplate.groupColors) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
      expect(typeColors, `group color ${color}`).not.toContain(color);
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

describe("web template checklist types", () => {
  const itemKeys = webTemplate.itemTypes.map((t) => t.key);

  it("only uses item types that exist", () => {
    // A check for a type that does not exist could never pass
    for (const entry of webTemplate.checklistItemTypes) {
      expect(itemKeys, `item type "${entry.itemType}"`).toContain(entry.itemType);
    }
  });

  it("lists each item type once", () => {
    const types = webTemplate.checklistItemTypes.map((e) => e.itemType);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe("web template warning rules", () => {
  const itemKeys = webTemplate.itemTypes.map((t) => t.key);
  const relationshipKeys = webTemplate.relationshipTypes.map((t) => t.key);

  it("only uses item types and relationship types that exist", () => {
    for (const rule of webTemplate.warningRules) {
      expect(itemKeys, `item type "${rule.itemType}"`).toContain(rule.itemType);
      expect(relationshipKeys, `relationship "${rule.relationship}"`).toContain(rule.relationship);
    }
  });

  it("has unique rule keys", () => {
    const keys = webTemplate.warningRules.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only asks for connections the template allows", () => {
    // A rule that can never be satisfied would warn forever
    for (const rule of webTemplate.warningRules) {
      const allowed = webTemplate.allowedCombinations.some(
        (c) =>
          c.relationship === rule.relationship &&
          (rule.direction === "incoming" ? c.target : c.source) === rule.itemType,
      );
      expect(allowed, `rule "${rule.key}" can never be satisfied`).toBe(true);
    }
  });
});
