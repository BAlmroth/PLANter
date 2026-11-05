import { describe, expect, it } from "vitest";
import type { Group } from "../groups/types";
import type { Item } from "../items/types";
import { hasFilters, matchesFilters, NO_FILTERS } from "./mapFilters";

const item: Item = {
  id: "i1",
  projectId: "p1",
  type: "page",
  title: "Home",
  description: null,
  status: "planned",
  isMvp: true,
  positionX: 0,
  positionY: 0,
  createdAt: "2026-11-05T00:00:00.000Z",
};
const group: Group = {
  id: "g1",
  projectId: "p1",
  name: "Navigation",
  description: null,
  createdAt: "2026-11-05T00:00:00.000Z",
  itemIds: ["i1"],
};

describe("matchesFilters", () => {
  it("shows everything when no filter is set", () => {
    expect(hasFilters(NO_FILTERS)).toBe(false);
    expect(matchesFilters(item, NO_FILTERS, [])).toBe(true);
  });

  it("filters on item type", () => {
    expect(matchesFilters(item, { ...NO_FILTERS, type: "page" }, [])).toBe(true);
    expect(matchesFilters(item, { ...NO_FILTERS, type: "component" }, [])).toBe(false);
  });

  it("filters on status", () => {
    expect(matchesFilters(item, { ...NO_FILTERS, status: "done" }, [])).toBe(false);
  });

  it("filters on MVP", () => {
    expect(matchesFilters(item, { ...NO_FILTERS, mvpOnly: true }, [])).toBe(true);
    expect(matchesFilters({ ...item, isMvp: false }, { ...NO_FILTERS, mvpOnly: true }, [])).toBe(false);
  });

  it("filters on group", () => {
    expect(matchesFilters(item, { ...NO_FILTERS, groupId: "g1" }, [group])).toBe(true);
    expect(matchesFilters({ ...item, id: "i2" }, { ...NO_FILTERS, groupId: "g1" }, [group])).toBe(false);
  });

  it("requires every active filter to match", () => {
    expect(matchesFilters(item, { ...NO_FILTERS, type: "page", status: "done" }, [])).toBe(false);
  });
});
