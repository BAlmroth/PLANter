import { describe, expect, it } from "vitest";
import type { Warning } from "./types";
import { groupWarningsByItem } from "./warningsByItem";

const warning = (rule: string, itemId: string): Warning => ({ rule, itemId, itemTitle: "T", message: "m" });

describe("groupWarningsByItem", () => {
  it("returns an empty map for no warnings", () => {
    expect(groupWarningsByItem([]).size).toBe(0);
  });

  it("groups warnings by item id and keeps their order", () => {
    const a1 = warning("page_without_components", "a");
    const b1 = warning("function_not_triggered", "b");
    const a2 = warning("mvp_without_tasks", "a");

    const byItem = groupWarningsByItem([a1, b1, a2]);
    expect(byItem.get("a")).toEqual([a1, a2]);
    expect(byItem.get("b")).toEqual([b1]);
  });

  it("has no entry for an item without warnings", () => {
    expect(groupWarningsByItem([warning("r", "a")]).has("other")).toBe(false);
  });
});
