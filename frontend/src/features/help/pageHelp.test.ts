import { describe, expect, it } from "vitest";
import { pageKeyFromPath } from "./pageHelp";

describe("pageKeyFromPath", () => {
  it("finds the overview with and without a trailing slash", () => {
    expect(pageKeyFromPath("/projects/abc", null)).toBe("overview");
    expect(pageKeyFromPath("/projects/abc/", null)).toBe("overview");
  });

  it("tells the list and the map apart by ?view=, with the list as default", () => {
    expect(pageKeyFromPath("/projects/abc/plan", null)).toBe("list");
    expect(pageKeyFromPath("/projects/abc/plan", "list")).toBe("list");
    expect(pageKeyFromPath("/projects/abc/plan", "map")).toBe("map");
    expect(pageKeyFromPath("/projects/abc/plan", "nonsense")).toBe("list");
  });

  it("finds an item page", () => {
    expect(pageKeyFromPath("/projects/abc/items/123", null)).toBe("item");
  });

  it("finds the other pages by name", () => {
    expect(pageKeyFromPath("/projects/abc/description", null)).toBe("description");
    expect(pageKeyFromPath("/projects/abc/moodboard", null)).toBe("moodboard");
    expect(pageKeyFromPath("/projects/abc/tasks", null)).toBe("tasks");
    expect(pageKeyFromPath("/projects/abc/checklist", null)).toBe("checklist");
  });

  it("returns null for a page without help", () => {
    expect(pageKeyFromPath("/projects/abc/nope", null)).toBeNull();
  });
});
