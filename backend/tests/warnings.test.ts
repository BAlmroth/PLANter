import { describe, expect, it } from "vitest";
import { findWarnings, MVP_WITHOUT_TASKS_RULE } from "../src/services/warnings.js";
import type { WarningItem } from "../src/services/warnings.js";
import { webTemplate } from "../src/templates/web.js";

function item(id: string, type: string, extra: Partial<WarningItem> = {}): WarningItem {
  return { id, type, title: `${type} ${id}`, status: "planned", isMvp: false, ...extra };
}

describe("findWarnings", () => {
  it("gives no warnings for an empty project", () => {
    expect(findWarnings(webTemplate, [], [], [])).toEqual([]);
  });

  it("warns about a page with no components", () => {
    const warnings = findWarnings(webTemplate, [item("p1", "page")], [], []);
    expect(warnings).toEqual([
      { rule: "page_without_components", itemId: "p1", itemTitle: "page p1", message: "has no components" },
    ]);
  });

  it("does not warn once a component belongs to the page", () => {
    const relationships = [{ sourceItemId: "c1", targetItemId: "p1", type: "belongs_to" }];
    const items = [item("p1", "page"), item("c1", "component")];
    expect(findWarnings(webTemplate, items, relationships, [])).toEqual([]);
  });

  it("checks the direction: a page that is the source does not count", () => {
    const relationships = [{ sourceItemId: "p1", targetItemId: "c1", type: "belongs_to" }];
    const warnings = findWarnings(webTemplate, [item("p1", "page")], relationships, []);
    expect(warnings.map((w) => w.rule)).toEqual(["page_without_components"]);
  });

  it("checks the relationship type: a different type does not count", () => {
    const relationships = [{ sourceItemId: "c1", targetItemId: "p1", type: "uses" }];
    const warnings = findWarnings(webTemplate, [item("p1", "page")], relationships, []);
    expect(warnings.map((w) => w.rule)).toEqual(["page_without_components"]);
  });

  it("warns about a function nothing triggers", () => {
    const warnings = findWarnings(webTemplate, [item("f1", "function")], [], []);
    expect(warnings.map((w) => w.rule)).toEqual(["function_not_triggered"]);
  });

  it("does not warn when a component triggers the function", () => {
    const relationships = [{ sourceItemId: "c1", targetItemId: "f1", type: "triggers" }];
    const items = [item("f1", "function"), item("c1", "component")];
    expect(findWarnings(webTemplate, items, relationships, [])).toEqual([]);
  });

  it("warns about an MVP item with no tasks", () => {
    const warnings = findWarnings(webTemplate, [item("d1", "design", { isMvp: true })], [], []);
    expect(warnings.map((w) => w.rule)).toEqual([MVP_WITHOUT_TASKS_RULE]);
  });

  it("does not warn about an MVP item that has a task", () => {
    const items = [item("d1", "design", { isMvp: true })];
    expect(findWarnings(webTemplate, items, [], [{ itemId: "d1" }])).toEqual([]);
  });

  it("does not warn about an MVP item that is done", () => {
    const items = [item("d1", "design", { isMvp: true, status: "done" })];
    expect(findWarnings(webTemplate, items, [], [])).toEqual([]);
  });

  it("does not warn about a non-MVP item with no tasks", () => {
    expect(findWarnings(webTemplate, [item("d1", "design")], [], [])).toEqual([]);
  });

  it("gives one warning per broken rule, so one item can have two", () => {
    const items = [item("p1", "page", { isMvp: true })];
    const rules = findWarnings(webTemplate, items, [], []).map((w) => w.rule);
    expect(rules).toEqual(["page_without_components", MVP_WITHOUT_TASKS_RULE]);
  });

  it("ignores rules for types the template does not have", () => {
    const template = { ...webTemplate, warningRules: [] };
    expect(findWarnings(template, [item("p1", "page")], [], [])).toEqual([]);
  });
});
