import { describe, expect, it } from "vitest";
import type { Check } from "./types";
import { getYetToPlan } from "./missingCategories";

function check(key: string, kind: Check["kind"], passed: boolean): Check {
  return { key, kind, label: key, passed };
}

describe("getYetToPlan", () => {
  it("returns the failed category checks", () => {
    const checks = [check("has_design", "category", false), check("has_testing", "category", true)];
    expect(getYetToPlan(checks).map((c) => c.key)).toEqual(["has_design"]);
  });

  it("leaves out readiness checks, also failed ones", () => {
    const checks = [check("has_sprint", "readiness", false), check("has_data", "category", false)];
    expect(getYetToPlan(checks).map((c) => c.key)).toEqual(["has_data"]);
  });

  it("keeps the order of the checklist", () => {
    const checks = [check("has_design", "category", false), check("has_data", "category", false)];
    expect(getYetToPlan(checks).map((c) => c.key)).toEqual(["has_design", "has_data"]);
  });

  it("returns an empty list when everything is planned", () => {
    expect(getYetToPlan([check("has_design", "category", true)])).toEqual([]);
  });
});
