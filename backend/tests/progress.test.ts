import { describe, expect, it } from "vitest";
import { calculateProgress, countProgress } from "../src/services/progress.js";
import type { Template } from "../src/templates/index.js";
import { webTemplate } from "../src/templates/web.js";

describe("countProgress", () => {
  it("counts 2 done of 4 items as 50%", () => {
    const items = [
      { type: "page", status: "done" as const },
      { type: "page", status: "done" as const },
      { type: "page", status: "planned" as const },
      { type: "page", status: "in_progress" as const },
    ];
    expect(countProgress(items)).toEqual({ done: 2, inProgress: 1, total: 4, percent: 50 });
  });

  it("is 0% for no items, not a division by zero", () => {
    expect(countProgress([])).toEqual({ done: 0, inProgress: 0, total: 0, percent: 0 });
  });

  it("counts in progress as not finished", () => {
    const items = [
      { type: "page", status: "done" as const },
      { type: "page", status: "in_progress" as const },
    ];
    expect(countProgress(items).percent).toBe(50);
  });

  it("counts in progress items without adding them to the percent", () => {
    const items = [
      { type: "page", status: "done" as const },
      { type: "page", status: "in_progress" as const },
      { type: "page", status: "in_progress" as const },
      { type: "page", status: "planned" as const },
    ];
    expect(countProgress(items)).toMatchObject({ inProgress: 2, done: 1, total: 4, percent: 25 });
  });

  it("rounds to a whole percent", () => {
    const items = [
      { type: "page", status: "done" as const },
      { type: "page", status: "planned" as const },
      { type: "page", status: "planned" as const },
    ];
    expect(countProgress(items).percent).toBe(33);
  });
});

describe("calculateProgress", () => {
  it("is 0% for a project with no items, with every category at 0%", () => {
    const result = calculateProgress(webTemplate, []);
    expect(result.percent).toBe(0);
    expect(result.total).toBe(0);
    expect(result.categories.length).toBeGreaterThan(0);
    expect(result.categories.every((category) => category.percent === 0)).toBe(true);
  });

  it("gives per category and total numbers", () => {
    const items = [
      { type: "page", status: "done" as const },
      { type: "page", status: "planned" as const },
      { type: "component", status: "done" as const },
      { type: "component", status: "done" as const },
    ];
    const result = calculateProgress(webTemplate, items);

    expect(result).toMatchObject({ done: 3, total: 4, percent: 75 });
    expect(result.categories.find((c) => c.key === "page")).toMatchObject({
      done: 1,
      total: 2,
      percent: 50,
    });
    expect(result.categories.find((c) => c.key === "component")).toMatchObject({
      done: 2,
      total: 2,
      percent: 100,
    });
  });

  it("lists categories in template order, including empty ones", () => {
    const result = calculateProgress(webTemplate, [{ type: "function", status: "done" }]);
    const keys = result.categories.map((c) => c.key);
    expect(keys).toEqual(webTemplate.itemTypes.filter((t) => t.countsTowardProgress).map((t) => t.key));
    expect(result.categories.find((c) => c.key === "page")).toMatchObject({ total: 0, percent: 0 });
  });

  it("ignores item types that do not count toward progress", () => {
    const template: Template = {
      ...webTemplate,
      itemTypes: [
        { key: "page", label: "Page", pluralLabel: "Pages", countsTowardProgress: true, color: "#2563A8" },
        { key: "note", label: "Note", pluralLabel: "Notes", countsTowardProgress: false, color: "#4B5563" },
      ],
    };
    const items = [
      { type: "page", status: "done" as const },
      { type: "note", status: "planned" as const },
    ];
    const result = calculateProgress(template, items);

    expect(result).toMatchObject({ done: 1, total: 1, percent: 100 });
    expect(result.categories.map((c) => c.key)).toEqual(["page"]);
  });

  it("ignores items whose type is not in the template", () => {
    const result = calculateProgress(webTemplate, [{ type: "unknown", status: "planned" }]);
    expect(result.total).toBe(0);
  });
});
