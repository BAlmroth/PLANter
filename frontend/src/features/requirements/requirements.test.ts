import { describe, expect, it } from "vitest";
import type { Item, Template } from "../items/types";
import { getConnectOptions } from "../relationships/connections";
import type { Relationship } from "../relationships/types";
import { getRequirementRows, isRequirement, isRequirementOption } from "./requirements";

const type = (key: string) => ({
  key, label: key, pluralLabel: key, countsTowardProgress: true, color: "#2563A8", description: "", example: "",
});

// A small game template: House can be made from Wood, cost Gold and be unlocked by a Quest
const game: Template = {
  key: "game",
  label: "Game",
  itemTypes: [type("location"), type("inventory"), type("quest"), type("character")],
  groupColors: [],
  relationshipTypes: [
    { key: "made_from", label: "made from", inverseLabel: "ingredient in", allowCycles: false, hasQuantity: true, requirement: "outgoing", description: "" },
    { key: "unlocks", label: "unlocks", inverseLabel: "unlocked by", allowCycles: false, requirement: "incoming", description: "" },
    { key: "appears_in", label: "appears in", inverseLabel: "features", allowCycles: true, description: "" },
  ],
  allowedCombinations: [
    { source: "location", relationship: "made_from", target: "inventory" },
    { source: "inventory", relationship: "made_from", target: "inventory" },
    { source: "quest", relationship: "unlocks", target: "location" },
    { source: "character", relationship: "appears_in", target: "location" },
  ],
};

// The web template has no requirement fields
const web: Template = {
  ...game,
  key: "web",
  itemTypes: [type("page"), type("component")],
  relationshipTypes: [{ key: "belongs_to", label: "part of", inverseLabel: "contains", allowCycles: false, description: "" }],
  allowedCombinations: [{ source: "component", relationship: "belongs_to", target: "page" }],
};

function item(id: string, itemType: string, title = id): Item {
  return {
    id, projectId: "p", type: itemType, title, description: null, status: "planned",
    isMvp: false, positionX: 0, positionY: 0, imageUrl: null, createdAt: "2026-11-14T00:00:00.000Z",
  };
}
const rel = (id: string, sourceItemId: string, targetItemId: string, t: string, quantity: number | null = null): Relationship => ({
  id, projectId: "p", sourceItemId, targetItemId, type: t, quantity,
});

const house = item("house", "location", "House 2");
const wood = item("wood", "inventory", "Wood");
const plank = item("plank", "inventory", "Plank");
const quest = item("quest", "quest", "Festival");
const smith = item("smith", "character", "Smith");
const items = [house, wood, plank, quest, smith];

describe("isRequirement", () => {
  it("counts an outgoing requirement only on the source", () => {
    const madeFrom = rel("r1", "house", "wood", "made_from");
    expect(isRequirement(madeFrom, "house", game)).toBe(true);
    expect(isRequirement(madeFrom, "wood", game)).toBe(false);
  });

  it("counts an incoming requirement only on the target", () => {
    const unlocks = rel("r2", "quest", "house", "unlocks");
    expect(isRequirement(unlocks, "house", game)).toBe(true);
    expect(isRequirement(unlocks, "quest", game)).toBe(false);
  });

  it("never counts an ordinary connection", () => {
    expect(isRequirement(rel("r3", "smith", "house", "appears_in"), "house", game)).toBe(false);
  });
});

describe("isRequirementOption", () => {
  it("picks the options that add a requirement to this item, from both sides", () => {
    // On Plank's page: "Wood ingredient in Plank" is Plank's requirement, "X made from Plank" is not
    const options = getConnectOptions("inventory", game).filter((o) => o.relationshipType === "made_from");
    const own = options.filter((o) => isRequirementOption(o, game));
    expect(own).toHaveLength(1);
    expect(own[0]?.newItemIsSource).toBe(false);
  });
});

describe("getRequirementRows", () => {
  const relationships = [
    rel("r1", "house", "wood", "made_from", 20),
    rel("r2", "quest", "house", "unlocks"),
    rel("r3", "smith", "house", "appears_in"),
    rel("r4", "plank", "wood", "made_from", 2), // Plank's requirement, not House's
  ];

  it("has one row per requirement type the item's category allows, worded from the item's side", () => {
    const rows = getRequirementRows(house, relationships, items, game, getConnectOptions("location", game));
    expect(rows.map((r) => [r.relationshipType, r.label, r.hasQuantity])).toEqual([
      ["made_from", "made from", true],
      ["unlocks", "unlocked by", false],
    ]);
  });

  it("lists only this item's own requirements, with amounts", () => {
    const rows = getRequirementRows(house, relationships, items, game, getConnectOptions("location", game));
    expect(rows[0]?.entries).toEqual([
      { id: "r1", label: "made from", otherTitle: "Wood", otherType: "inventory", amount: { value: 20, isSource: true } },
    ]);
    expect(rows[1]?.entries.map((e) => e.otherTitle)).toEqual(["Festival"]);
  });

  it("leaves out rows the category can never have", () => {
    // A quest is never made from anything or unlocked here
    expect(getRequirementRows(quest, relationships, items, game, getConnectOptions("quest", game))).toEqual([]);
  });

  it("has no rows in the web template, so the card is never shown there", () => {
    const page = item("page", "page");
    expect(getRequirementRows(page, [], [page], web, getConnectOptions("page", web))).toEqual([]);
    expect(getConnectOptions("component", web).some((o) => isRequirementOption(o, web))).toBe(false);
  });
});
