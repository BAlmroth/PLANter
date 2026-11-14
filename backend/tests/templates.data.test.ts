import { describe, it, expect } from "vitest";
import { allTemplates, getTemplate, listTemplates } from "../src/templates/index.js";
import { webTemplate } from "../src/templates/web.js";
import { gameTemplate } from "../src/templates/game.js";

// These tests check the template data itself, so a typo in a key
// (like "componnent") fails here instead of silently never matching.
describe.each(allTemplates())("$key template data", (template) => {
  const itemKeys = template.itemTypes.map((t) => t.key);
  const relationshipKeys = template.relationshipTypes.map((t) => t.key);

  it("has unique item type keys", () => {
    expect(new Set(itemKeys).size).toBe(itemKeys.length);
  });

  it("has unique relationship type keys", () => {
    expect(new Set(relationshipKeys).size).toBe(relationshipKeys.length);
  });

  it("only uses item types that exist as source and target", () => {
    for (const c of template.allowedCombinations) {
      expect(itemKeys, `source "${c.source}"`).toContain(c.source);
      expect(itemKeys, `target "${c.target}"`).toContain(c.target);
    }
  });

  it("only uses relationship types that exist", () => {
    for (const c of template.allowedCombinations) {
      expect(relationshipKeys, `relationship "${c.relationship}"`).toContain(c.relationship);
    }
  });

  it("has no duplicate combinations", () => {
    const combos = template.allowedCombinations.map(
      (c) => `${c.source}|${c.relationship}|${c.target}`,
    );
    expect(new Set(combos).size).toBe(combos.length);
  });

  it("uses every relationship type in at least one combination", () => {
    const used = new Set(template.allowedCombinations.map((c) => c.relationship));
    for (const key of relationshipKeys) {
      expect(used.has(key), `relationship "${key}" is never used`).toBe(true);
    }
  });

  it("has a non-empty label for every item and relationship type", () => {
    for (const t of template.itemTypes) {
      expect(t.label).not.toBe("");
      expect(t.pluralLabel).not.toBe("");
    }
    for (const r of template.relationshipTypes) {
      expect(r.label).not.toBe("");
      expect(r.inverseLabel).not.toBe("");
    }
  });

  it("never uses the same phrase for two connections", () => {
    // "used by" on two types made the map ambiguous: which connection is it?
    const phrases = template.relationshipTypes.flatMap((r) => [r.label, r.inverseLabel]);
    expect(new Set(phrases).size).toBe(phrases.length);
  });

  it("has help text for every item and relationship type", () => {
    // Beginners rely on these, so an empty one would show a blank help line
    for (const t of template.itemTypes) {
      expect(t.description.trim(), `description of "${t.key}"`).not.toBe("");
      expect(t.example.trim(), `example of "${t.key}"`).not.toBe("");
    }
    for (const r of template.relationshipTypes) {
      expect(r.description.trim(), `description of "${r.key}"`).not.toBe("");
    }
  });

  it("has a #RRGGBB color for every item type", () => {
    // The color ends up in a style attribute, so it must be a plain hex color
    for (const t of template.itemTypes) {
      expect(t.color, `color of "${t.key}"`).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it("marks at most one item type as the overview card", () => {
    const cards = template.itemTypes.filter((t) => t.overviewCard);
    expect(cards.length).toBeLessThanOrEqual(1);
  });

  it("has a different color for every item type", () => {
    const colors = template.itemTypes.map((t) => t.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it("has unique #RRGGBB group colors that are not item type colors", () => {
    const typeColors = template.itemTypes.map((t) => t.color);
    expect(template.groupColors.length).toBeGreaterThan(0);
    expect(new Set(template.groupColors).size).toBe(template.groupColors.length);
    for (const color of template.groupColors) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
      expect(typeColors, `group color ${color}`).not.toContain(color);
    }
  });
});

describe.each(allTemplates())("$key template checklist types", (template) => {
  const itemKeys = template.itemTypes.map((t) => t.key);

  it("only uses item types that exist", () => {
    // A check for a type that does not exist could never pass
    for (const entry of template.checklistItemTypes) {
      expect(itemKeys, `item type "${entry.itemType}"`).toContain(entry.itemType);
    }
  });

  it("lists each item type once", () => {
    const types = template.checklistItemTypes.map((e) => e.itemType);
    expect(new Set(types).size).toBe(types.length);
  });
});

describe.each(allTemplates())("$key template warning rules", (template) => {
  const itemKeys = template.itemTypes.map((t) => t.key);
  const relationshipKeys = template.relationshipTypes.map((t) => t.key);

  it("only uses item types and relationship types that exist", () => {
    for (const rule of template.warningRules) {
      expect(itemKeys, `item type "${rule.itemType}"`).toContain(rule.itemType);
      expect(relationshipKeys, `relationship "${rule.relationship}"`).toContain(rule.relationship);
    }
  });

  it("has unique rule keys", () => {
    const keys = template.warningRules.map((r) => r.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("only asks for connections the template allows", () => {
    // A rule that can never be satisfied would warn forever
    for (const rule of template.warningRules) {
      const allowed = template.allowedCombinations.some(
        (c) =>
          c.relationship === rule.relationship &&
          (rule.direction === "incoming" ? c.target : c.source) === rule.itemType,
      );
      expect(allowed, `rule "${rule.key}" can never be satisfied`).toBe(true);
    }
  });
});

describe("getTemplate", () => {
  it("returns the web template for 'web'", () => {
    expect(getTemplate("web")).toBe(webTemplate);
  });

  it("returns the game template for 'game'", () => {
    expect(getTemplate("game")).toBe(gameTemplate);
  });

  it("stores every template under its own key", () => {
    // A template registered under the wrong key would save the wrong key on new projects
    for (const template of allTemplates()) {
      expect(getTemplate(template.key)).toBe(template);
    }
  });

  it("returns undefined for an unknown key", () => {
    expect(getTemplate("nope")).toBeUndefined();
  });

  it("returns undefined for keys on Object.prototype", () => {
    expect(getTemplate("constructor")).toBeUndefined();
    expect(getTemplate("__proto__")).toBeUndefined();
  });
});

describe("listTemplates", () => {
  it("lists key, label and description of every template, web first", () => {
    expect(listTemplates()).toEqual([
      { key: "web", label: webTemplate.label, description: webTemplate.description },
      { key: "game", label: gameTemplate.label, description: gameTemplate.description },
    ]);
  });
});

describe("game template rules", () => {
  const relationship = (key: string) => gameTemplate.relationshipTypes.find((r) => r.key === key);

  it("rejects loops in progression, story order and structure", () => {
    // "The key is behind the door it opens" is a soft-lock, so the cycle check must run for unlocks
    expect(relationship("unlocks")?.allowCycles).toBe(false);
    expect(relationship("leads_to")?.allowCycles).toBe(false);
    expect(relationship("part_of")?.allowCycles).toBe(false);
    // A recipe that needs its own result can never be made
    expect(relationship("made_from")?.allowCycles).toBe(false);
    // An upgrade chain has to end: house 1 -> house 2 -> house 1 is a mistake
    expect(relationship("upgrades_to")?.allowCycles).toBe(false);
  });

  it("only upgrades within the same category", () => {
    const upgrades = gameTemplate.allowedCombinations.filter((c) => c.relationship === "upgrades_to");
    expect(upgrades.length).toBeGreaterThan(0);
    for (const c of upgrades) expect(c.source, `${c.source} -> ${c.target}`).toBe(c.target);
  });

  it("allows loops between places and screens", () => {
    expect(relationship("connects_to")?.allowCycles).toBe(true);
    expect(relationship("opens")?.allowCycles).toBe(true);
  });
});

