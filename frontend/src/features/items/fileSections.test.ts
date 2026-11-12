import { describe, expect, it } from "vitest";
import type { Group } from "../groups/types";
import { getFileSections } from "./fileSections";
import type { Item, Template } from "./types";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [
    { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", description: "A screen.", example: "" },
    { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#0F7673", description: "", example: "" },
  ],
  groupColors: [],
  relationshipTypes: [],
  allowedCombinations: [],
};

function item(id: string, type: string): Item {
  return {
    id,
    projectId: "p1",
    type,
    title: id,
    description: null,
    status: "planned",
    isMvp: false,
    positionX: 0,
    positionY: 0,
    imageUrl: null,
    createdAt: "2026-11-04T10:00:00Z",
  };
}

function group(id: string, itemIds: string[]): Group {
  return { id, projectId: "p1", name: id, description: `About ${id}`, color: "#3D8FD1", createdAt: "2026-11-04T10:00:00Z", itemIds };
}

const items = [item("home", "page"), item("nav", "component"), item("footer", "component")];
const ids = (section: { items: Item[] }) => section.items.map((i) => i.id);

describe("getFileSections: category", () => {
  it("has one section per item type, even when empty", () => {
    const sections = getFileSections("category", [item("home", "page")], template, []);
    expect(sections.map((s) => [s.title, ids(s)])).toEqual([
      ["Pages", ["home"]],
      ["Components", []],
    ]);
  });

  it("puts items with an unknown type last under Unknown", () => {
    const sections = getFileSections("category", [...items, item("x", "old-type")], template, []);
    expect(sections.at(-1)).toMatchObject({ title: "Unknown", items: [{ id: "x" }] });
  });

  it("gives each section its item type's color, and Unknown none", () => {
    const sections = getFileSections("category", [...items, item("x", "old-type")], template, []);
    expect(sections.map((s) => s.color)).toEqual(["#2563A8", "#0F7673", null]);
  });

  it("uses the item type's help text as the description, and Unknown has none", () => {
    const sections = getFileSections("category", [...items, item("x", "old-type")], template, []);
    expect(sections[0].description).toBe("A screen.");
    expect(sections.at(-1)?.description).toBeNull();
  });
});

describe("getFileSections: group", () => {
  it("has one section per group, titled with the group name", () => {
    const sections = getFileSections("group", items, template, [group("Navigation", ["nav", "footer"]), group("Empty", [])]);
    expect(sections.map((s) => [s.title, ids(s)])).toEqual([
      ["Navigation", ["nav", "footer"]],
      ["Empty", []],
      ["No group", ["home"]],
    ]);
    expect(sections[0].description).toBe("About Navigation");
  });

  it("shows an item in every group it is in, and not under No group", () => {
    const sections = getFileSections("group", items, template, [group("A", ["nav"]), group("B", ["nav", "home"])]);
    expect(sections.map(ids)).toEqual([["nav"], ["home", "nav"], ["footer"]]);
  });

  it("leaves out No group when every item is in a group", () => {
    const sections = getFileSections("group", items, template, [group("All", ["home", "nav", "footer"])]);
    expect(sections.map((s) => s.title)).toEqual(["All"]);
  });

  it("gives each section its group's color, and No group none", () => {
    const rose = { ...group("Forms", ["nav"]), color: "#D45A8A" };
    const sections = getFileSections("group", items, template, [rose]);
    expect(sections.map((s) => s.color)).toEqual(["#D45A8A", null]);
  });
});
