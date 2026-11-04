import { afterEach, describe, expect, it, vi } from "vitest";

// sprintsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { createSprint, deleteSprint, listSprints, updateSprint } from "./sprintsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("sprintsApi", () => {
  it("listSprints calls the project's sprints path", async () => {
    await listSprints("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/sprints");
  });

  it("createSprint posts the name to the project's sprints", async () => {
    await createSprint("p1", "Sprint 1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/sprints");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ name: "Sprint 1" });
  });

  it("updateSprint patches the sprint by id", async () => {
    await updateSprint("s1", "Sprint one");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/sprints/s1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ name: "Sprint one" });
  });

  it("deleteSprint deletes the sprint by id", async () => {
    await deleteSprint("s1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/sprints/s1");
    expect(options.method).toBe("DELETE");
  });
});
