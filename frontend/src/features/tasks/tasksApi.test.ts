import { afterEach, describe, expect, it, vi } from "vitest";

// tasksApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { createTask, deleteTask, listTasks, updateTask } from "./tasksApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("tasksApi", () => {
  it("listTasks calls the project's tasks path", async () => {
    await listTasks("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/tasks");
  });

  it("createTask posts the input as JSON to the project's tasks", async () => {
    await createTask("p1", { title: "Build form", itemId: "i1" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/tasks");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ title: "Build form", itemId: "i1" });
  });

  it("updateTask patches the task by id", async () => {
    await updateTask("t1", { done: true, itemId: null });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/tasks/t1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ done: true, itemId: null });
  });

  it("deleteTask deletes the task by id", async () => {
    await deleteTask("t1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/tasks/t1");
    expect(options.method).toBe("DELETE");
  });
});
