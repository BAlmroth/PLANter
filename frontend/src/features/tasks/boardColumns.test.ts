import { describe, expect, it } from "vitest";
import { nextStatus, previousStatus, tasksForScope } from "./boardColumns";
import type { Task } from "./types";

const task = (id: string, sprintId: string | null): Task => ({
  id,
  projectId: "p",
  itemId: null,
  title: id,
  status: "planned",
  sprintId,
});

describe("board columns", () => {
  it("moves one column at a time", () => {
    expect(nextStatus("planned")).toBe("in_progress");
    expect(nextStatus("in_progress")).toBe("done");
    expect(previousStatus("done")).toBe("in_progress");
    expect(previousStatus("in_progress")).toBe("planned");
  });

  it("has nowhere to go past the first and last column", () => {
    expect(previousStatus("planned")).toBeNull();
    expect(nextStatus("done")).toBeNull();
  });
});

describe("tasksForScope", () => {
  const tasks = [task("a", "s1"), task("b", "s2"), task("c", null)];

  it("shows every task for all", () => {
    expect(tasksForScope(tasks, "all")).toHaveLength(3);
  });

  it("shows only the tasks of one sprint", () => {
    expect(tasksForScope(tasks, "s1").map((t) => t.id)).toEqual(["a"]);
  });

  it("shows only the tasks without a sprint for none", () => {
    expect(tasksForScope(tasks, "none").map((t) => t.id)).toEqual(["c"]);
  });
});
