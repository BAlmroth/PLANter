import { describe, expect, it } from "vitest";
import { diffGroupIds, getGroupsOfItem, withItemInGroups } from "./itemGroups";
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

describe("diffGroupIds", () => {
  it("lists the new groups to add and the unticked groups to remove", () => {
    expect(diffGroupIds(["nav", "forms"], ["forms", "footer"])).toEqual({ add: ["footer"], remove: ["nav"] });
  });

  it("changes nothing when the choice is the same", () => {
    expect(diffGroupIds(["nav"], ["nav"])).toEqual({ add: [], remove: [] });
  });
});

describe("withItemInGroups", () => {
  const groups = [group("nav", ["a", "b"]), group("forms", ["b"]), group("empty", [])];

  it("adds the item to chosen groups and removes it from the others", () => {
    const result = withItemInGroups(groups, "b", ["nav", "empty"]);
    expect(result.map((g) => g.itemIds)).toEqual([["a", "b"], [], ["b"]]);
  });

  it("keeps the same group objects when nothing changes", () => {
    const result = withItemInGroups(groups, "a", ["nav"]);
    expect(result[0]).toBe(groups[0]);
    expect(result[1]).toBe(groups[1]);
  });
});
