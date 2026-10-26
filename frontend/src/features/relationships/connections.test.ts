import { describe, expect, it } from "vitest";
import type { Item, Template } from "../items/types";
import { getConnections } from "./connections";
import type { Relationship } from "./types";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [],
  relationshipTypes: [{ key: "uses", label: "uses", inverseLabel: "used by", allowCycles: true }],
  allowedCombinations: [],
};

function item(id: string, title: string): Item {
  return {
    id, projectId: "p", type: "page", title, description: null, status: "planned",
    isMvp: false, positionX: 0, positionY: 0, createdAt: "2026-10-26T00:00:00.000Z",
  };
}

const page = item("1", "LoginPage");
const button = item("2", "Button");
const relationship: Relationship = { id: "r1", projectId: "p", sourceItemId: "1", targetItemId: "2", type: "uses" };

describe("getConnections", () => {
  it("shows the label on the source item", () => {
    expect(getConnections("1", [relationship], [page, button], template)).toEqual([
      { id: "r1", label: "uses", otherTitle: "Button" },
    ]);
  });

  it("shows the inverseLabel on the target item", () => {
    expect(getConnections("2", [relationship], [page, button], template)).toEqual([
      { id: "r1", label: "used by", otherTitle: "LoginPage" },
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
