import { afterEach, describe, expect, it, vi } from "vitest";

// groupsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import {
  addItemToGroup,
  createGroup,
  deleteGroup,
  listGroups,
  removeItemFromGroup,
  updateGroup,
} from "./groupsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("groupsApi", () => {
  it("listGroups calls the project's groups path", async () => {
    await listGroups("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/groups");
  });

  it("createGroup posts the input to the project's groups", async () => {
    await createGroup("p1", { name: "Navigation", description: "Nav, header, footer" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/groups");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ name: "Navigation", description: "Nav, header, footer" });
  });

  it("updateGroup patches the group by id", async () => {
    await updateGroup("g1", { name: "Nav", description: "" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/groups/g1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ name: "Nav", description: "" });
  });

  it("deleteGroup deletes the group by id", async () => {
    await deleteGroup("g1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/groups/g1");
    expect(options.method).toBe("DELETE");
  });

  it("addItemToGroup puts the item in the group", async () => {
    await addItemToGroup("g1", "i1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/groups/g1/items/i1");
    expect(options.method).toBe("PUT");
  });

  it("removeItemFromGroup deletes the item from the group", async () => {
    await removeItemFromGroup("g1", "i1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/groups/g1/items/i1");
    expect(options.method).toBe("DELETE");
  });
});
