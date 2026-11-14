import { describe, it, expect } from "vitest";
import { sortSprints } from "./sortSprints";
import type { Sprint } from "./types";

const sprint = (name: string): Sprint => ({ id: name, projectId: "p", name });

describe("sortSprints", () => {
  it("puts Sprint 2 before Sprint 10 and ignores case", () => {
    const names = sortSprints(["Sprint 10", "sprint 2", "Backlog", "Sprint 1"].map(sprint)).map((s) => s.name);
    expect(names).toEqual(["Backlog", "Sprint 1", "sprint 2", "Sprint 10"]);
  });

  it("does not change the list it is given", () => {
    const list = ["B", "A"].map(sprint);
    sortSprints(list);
    expect(list.map((s) => s.name)).toEqual(["B", "A"]);
  });
});
