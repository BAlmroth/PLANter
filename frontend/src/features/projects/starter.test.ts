import { describe, expect, it } from "vitest";
import type { Template } from "../items/types";
import { EMPTY_STARTER, addEntry, itemCount, starterSummary, toCreateInput } from "./starter";

const template: Template = {
  key: "web",
  label: "Web",
  itemTypes: [
    { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8", description: "", example: "" },
    { key: "component", label: "Component", pluralLabel: "Components", countsTowardProgress: true, color: "#0F7673", description: "", example: "" },
  ],
  groupColors: [],
  relationshipTypes: [],
  allowedCombinations: [],
};

const basics = { name: "Portfolio", description: "", template: "web" };

describe("addEntry", () => {
  it("adds a trimmed name", () => {
    expect(addEntry(["Home"], "  About ")).toEqual(["Home", "About"]);
  });

  it("ignores empty names and names already in the list, in any case", () => {
    expect(addEntry(["Home"], "   ")).toEqual(["Home"]);
    expect(addEntry(["Home"], "home")).toEqual(["Home"]);
  });

  it("stops at the limit", () => {
    expect(addEntry(["a", "b"], "c", 2)).toEqual(["a", "b"]);
  });
});

describe("itemCount", () => {
  it("counts the items of all categories together", () => {
    expect(itemCount({ ...EMPTY_STARTER, items: { page: ["Home", "About"], component: ["Header"] } })).toBe(3);
  });
});

describe("toCreateInput", () => {
  it("sends only name and template when nothing was added", () => {
    expect(toCreateInput(basics, EMPTY_STARTER, template)).toEqual({ name: "Portfolio", template: "web" });
  });

  it("sends the items in template order, plus groups, tasks and the description", () => {
    const starter = {
      items: { component: ["Header"], page: ["Home"] },
      groups: ["Navigation"],
      tasks: ["Set up the repo"],
    };
    expect(toCreateInput({ ...basics, description: "My site" }, starter, template)).toEqual({
      name: "Portfolio",
      template: "web",
      description: "My site",
      items: [
        { type: "page", title: "Home" },
        { type: "component", title: "Header" },
      ],
      groups: [{ name: "Navigation" }],
      tasks: [{ title: "Set up the repo" }],
    });
  });
});

describe("starterSummary", () => {
  it("is null when nothing was added", () => {
    expect(starterSummary(EMPTY_STARTER, template)).toBeNull();
  });

  it("uses singular and plural labels and joins the last part with 'and'", () => {
    const starter = { items: { page: ["Home", "About"], component: ["Header"] }, groups: [], tasks: ["Repo"] };
    expect(starterSummary(starter, template)).toBe("2 pages, 1 component and 1 task");
  });

  it("has no 'and' for a single part", () => {
    expect(starterSummary({ ...EMPTY_STARTER, groups: ["Nav"] }, template)).toBe("1 group");
  });
});
