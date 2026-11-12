import { describe, expect, it } from "vitest";
import type { Item, Template } from "../items/types";
import {
  getAllowedRelationshipTypes,
  getConnectOptions,
  getConnections,
  groupConnectionsByLabel,
  type Connection,
} from "./connections";
import type { Relationship } from "./types";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [{ key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", description: "", example: "" }],
  groupColors: [],
  relationshipTypes: [{ key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true, description: "" }],
  allowedCombinations: [],
};

function item(id: string, title: string): Item {
  return {
    id, projectId: "p", type: "page", title, description: null, status: "planned",
    isMvp: false, positionX: 0, positionY: 0, imageUrl: null, createdAt: "2026-10-26T00:00:00.000Z",
  };
}

const page = item("1", "LoginPage");
const button = item("2", "Button");
const relationship: Relationship = { id: "r1", projectId: "p", sourceItemId: "1", targetItemId: "2", type: "uses" };

describe("getConnections", () => {
  it("shows the label on the source item", () => {
    expect(getConnections("1", [relationship], [page, button], template)).toEqual([
      { id: "r1", label: "uses", otherTitle: "Button", otherType: "page" },
    ]);
  });

  it("shows the inverseLabel on the target item", () => {
    expect(getConnections("2", [relationship], [page, button], template)).toEqual([
      { id: "r1", label: "used by", otherTitle: "LoginPage", otherType: "page" },
    ]);
  });

  it("ignores relationships of other items", () => {
    expect(getConnections("3", [relationship], [page, button], template)).toEqual([]);
  });

  it("shows an unknown relationship type as Unknown", () => {
    const odd = { ...relationship, type: "hugs" };
    expect(getConnections("1", [odd], [page, button], template)[0]?.label).toBe("Unknown");
  });

  it("skips a connection whose other item is missing", () => {
    expect(getConnections("1", [relationship], [page], template)).toEqual([]);
  });
});

describe("getConnectOptions", () => {
  const web: Template = {
    key: "web",
    label: "Web",
    itemTypes: [
      { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", description: "", example: "" },
      { key: "asset", label: "Asset", pluralLabel: "Assets", countsTowardProgress: true, color: "#2563A8", description: "", example: "" },
      { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#2563A8", description: "", example: "" },
    ],
    groupColors: [],
    relationshipTypes: [
      { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true, description: "" },
      { key: "belongs_to", label: "belongs to", inverseLabel: "contains", allowCycles: false, description: "" },
    ],
    allowedCombinations: [
      { source: "page", relationship: "uses", target: "asset" },
      { source: "component", relationship: "belongs_to", target: "page" },
      { source: "component", relationship: "belongs_to", target: "component" },
    ],
  };

  it("when this item is the target, the new item is the source and the verb is the label", () => {
    // "component belongs to page": on a page, the new item is a component that belongs to it
    const option = getConnectOptions("page", web).find((o) => o.newItemType === "component");
    expect(option).toMatchObject({
      verb: "belongs to",
      newItemTypeLabel: "Component",
      thisItemTypeLabel: "Page",
      relationshipType: "belongs_to",
      newItemIsSource: true,
    });
  });

  it("when this item is the source, the new item is the target and the verb is the inverseLabel", () => {
    // "page uses asset": on a page, the new item is an asset that is used by it
    const option = getConnectOptions("page", web).find((o) => o.newItemType === "asset");
    expect(option).toMatchObject({ verb: "used by", relationshipType: "uses", newItemIsSource: false });
  });

  it("offers both directions when source and target type are the same", () => {
    const verbs = getConnectOptions("component", web)
      .filter((o) => o.newItemType === "component")
      .map((o) => o.verb);
    expect(verbs).toEqual(["belongs to", "contains"]);
  });

  it("gives every option a unique key", () => {
    const keys = getConnectOptions("component", web).map((o) => o.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("offers nothing for a type that is not in any combination", () => {
    expect(getConnectOptions("quest", web)).toEqual([]);
  });
});

describe("getAllowedRelationshipTypes", () => {
  const withRules: Template = {
    ...template,
    groupColors: [],
    relationshipTypes: [
      { key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true, description: "" },
      { key: "tests", label: "tests", inverseLabel: "tested by", allowCycles: true, description: "" },
    ],
    allowedCombinations: [
      { source: "page", relationship: "uses", target: "component" },
      { source: "page", relationship: "tests", target: "page" },
    ],
  };

  it("returns only the types allowed for this source and target", () => {
    expect(getAllowedRelationshipTypes("page", "component", withRules).map((t) => t.key)).toEqual(["uses"]);
  });

  it("is directional and returns nothing for a combination that is not allowed", () => {
    expect(getAllowedRelationshipTypes("component", "page", withRules)).toEqual([]);
  });
});

describe("groupConnectionsByLabel", () => {
  const uses1: Connection = { id: "a", label: "uses", otherTitle: "Button", otherType: "component" };
  const usedBy: Connection = { id: "b", label: "used by", otherTitle: "Home", otherType: "page" };
  const uses2: Connection = { id: "c", label: "uses", otherTitle: "Navbar", otherType: "component" };

  it("puts connections with the same label together, in first-seen order", () => {
    expect(groupConnectionsByLabel([uses1, usedBy, uses2])).toEqual([
      { label: "uses", connections: [uses1, uses2] },
      { label: "used by", connections: [usedBy] },
    ]);
  });

  it("returns no groups for no connections", () => {
    expect(groupConnectionsByLabel([])).toEqual([]);
  });
});
