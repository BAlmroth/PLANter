import { afterEach, describe, expect, it, vi } from "vitest";

// itemsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { createItem, deleteItem, getTemplate, listItems, updateItem } from "./itemsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("itemsApi", () => {
  it("getTemplate and listItems call the right paths", async () => {
    await getTemplate("web");
    await listItems("p1");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/api/templates/web");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/projects/p1/items");
  });

  it("createItem posts the input as JSON to the project's items", async () => {
    await createItem("p1", { title: "Login", type: "page" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/items");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ title: "Login", type: "page" });
  });

  it("updateItem patches the item by id", async () => {
    await updateItem("i1", { status: "done" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/items/i1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ status: "done" });
  });

  it("deleteItem sends DELETE to the item", async () => {
    await deleteItem("i1");

    expect(apiRequest).toHaveBeenCalledWith("/api/items/i1", { method: "DELETE" });
  });
});
