import { describe, expect, it } from "vitest";
import { buildChecklist } from "../src/services/checklist.js";
import type { WarningItem } from "../src/services/warnings.js";
import { webTemplate } from "../src/templates/web.js";

function item(id: string, type: string, extra: Partial<WarningItem> = {}): WarningItem {
  return { id, type, title: `${type} ${id}`, status: "planned", isMvp: false, ...extra };
}

// Looks up one check's passed flag by key
function passed(checks: ReturnType<typeof buildChecklist>, key: string) {
  const check = checks.find((c) => c.key === key);
  if (!check) throw new Error(`no check "${key}"`);
  return check.passed;
}

describe("buildChecklist", () => {
  it("fails every check for an empty project", () => {
    const checks = buildChecklist(webTemplate, [], [], [], 0);
    expect(checks.every((c) => !c.passed)).toBe(true);
  });

  it("has one category check per checklist type in the template, in template order", () => {
    const checks = buildChecklist(webTemplate, [], [], [], 0).filter((c) => c.kind === "category");
    expect(checks.map((c) => c.key)).toEqual(webTemplate.checklistItemTypes.map((e) => `has_${e.itemType}`));
  });

  it("passes a category check once the project has an item of that type", () => {
    const checks = buildChecklist(webTemplate, [item("t1", "testing")], [], [], 0);
    expect(passed(checks, "has_testing")).toBe(true);
    expect(passed(checks, "has_authentication")).toBe(false);
  });

  it("counts a category as planned no matter the item's status", () => {
    const checks = buildChecklist(webTemplate, [item("d1", "design", { status: "done" })], [], [], 0);
    expect(passed(checks, "has_design")).toBe(true);
  });

  it("passes has_mvp when an item is marked MVP", () => {
    expect(passed(buildChecklist(webTemplate, [item("d1", "design")], [], [], 0), "has_mvp")).toBe(false);
    expect(passed(buildChecklist(webTemplate, [item("d1", "design", { isMvp: true })], [], [], 0), "has_mvp")).toBe(true);
  });

  it("fails mvp_has_tasks while there is no MVP at all", () => {
    expect(passed(buildChecklist(webTemplate, [item("d1", "design")], [], [], 0), "mvp_has_tasks")).toBe(false);
  });

  it("passes mvp_has_tasks only when every MVP item has a task", () => {
    const items = [item("d1", "design", { isMvp: true }), item("d2", "design", { isMvp: true })];
    expect(passed(buildChecklist(webTemplate, items, [], [{ itemId: "d1" }], 0), "mvp_has_tasks")).toBe(false);
    expect(passed(buildChecklist(webTemplate, items, [], [{ itemId: "d1" }, { itemId: "d2" }], 0), "mvp_has_tasks")).toBe(true);
  });

  it("passes has_sprint when the project has a sprint", () => {
    expect(passed(buildChecklist(webTemplate, [], [], [], 0), "has_sprint")).toBe(false);
    expect(passed(buildChecklist(webTemplate, [], [], [], 1), "has_sprint")).toBe(true);
  });

  it("fails connections while a page has no components, and passes once one belongs to it", () => {
    const items = [item("p1", "page"), item("c1", "component")];
    expect(passed(buildChecklist(webTemplate, items, [], [], 0), "connections")).toBe(false);

    const relationships = [{ sourceItemId: "c1", targetItemId: "p1", type: "belongs_to" }];
    expect(passed(buildChecklist(webTemplate, items, relationships, [], 0), "connections")).toBe(true);
  });

  it("does not let an MVP item without tasks fail the connections check", () => {
    const checks = buildChecklist(webTemplate, [item("d1", "design", { isMvp: true })], [], [], 0);
    expect(passed(checks, "connections")).toBe(true);
    expect(passed(checks, "mvp_has_tasks")).toBe(false);
  });

  it("has unique keys", () => {
    const keys = buildChecklist(webTemplate, [], [], [], 0).map((c) => c.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
