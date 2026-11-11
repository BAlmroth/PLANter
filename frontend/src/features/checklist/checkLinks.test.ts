import { describe, expect, it } from "vitest";
import { linkForCheck } from "./checkLinks";
import type { Check } from "./types";

function check(key: string, kind: Check["kind"]): Check {
  return { key, kind, label: key, passed: false };
}

describe("linkForCheck", () => {
  it("sends every category check to the item list", () => {
    expect(linkForCheck(check("has_testing", "category"))?.to).toBe("../plan?view=list");
    expect(linkForCheck(check("has_anything_new", "category"))?.to).toBe("../plan?view=list");
  });

  it("sends the sprint check to the tasks page", () => {
    expect(linkForCheck(check("has_sprint", "readiness"))).toMatchObject({ to: "../tasks", samePage: false });
  });

  it("sends the MVP task and connections checks to the item warnings on the same page", () => {
    expect(linkForCheck(check("mvp_has_tasks", "readiness"))).toMatchObject({ to: "#item-warnings", samePage: true });
    expect(linkForCheck(check("connections", "readiness"))).toMatchObject({ to: "#item-warnings", samePage: true });
  });

  it("gives no link for an unknown readiness key instead of crashing", () => {
    expect(linkForCheck(check("something_else", "readiness"))).toBeNull();
  });
});
