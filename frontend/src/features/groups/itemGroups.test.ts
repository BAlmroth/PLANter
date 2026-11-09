import { describe, expect, it } from "vitest";
import { getGroupsOfItem } from "./itemGroups";
import type { Group } from "./types";

function group(id: string, itemIds: string[]): Group {
  return { id, projectId: "p1", name: id, description: null, color: "#3D8FD1", createdAt: "2026-11-04T10:00:00Z", itemIds };
}

describe("getGroupsOfItem", () => {
  const groups = [group("nav", ["a", "b"]), group("forms", ["b"]), group("empty", [])];

  it("returns every group the item is in", () => {
    expect(getGroupsOfItem("b", groups).map((g) => g.id)).toEqual(["nav", "forms"]);
  });

  it("returns an empty list for an item in no group", () => {
    expect(getGroupsOfItem("c", groups)).toEqual([]);
  });
});
