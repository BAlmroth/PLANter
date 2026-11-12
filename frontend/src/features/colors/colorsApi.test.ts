import { afterEach, describe, expect, it, vi } from "vitest";

// colorsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { createColor, deleteColor, linkColor, listColors, listItemColors, unlinkColor, updateColor } from "./colorsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("colorsApi", () => {
  it("listColors and listItemColors call the project's paths", async () => {
    await listColors("p1");
    await listItemColors("p1");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/api/projects/p1/colors");
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/projects/p1/item-colors");
  });

  it("createColor posts the input to the project's colors", async () => {
    await createColor("p1", { hex: "#3E6554", name: "Green" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/colors");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ hex: "#3E6554", name: "Green" });
  });

  it("updateColor patches by id, and deleteColor deletes by id", async () => {
    await updateColor("c1", { name: "" });
    await deleteColor("c1");

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/colors/c1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ name: "" });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/colors/c1", { method: "DELETE" });
  });

  it("linkColor puts and unlinkColor deletes the link between an item and a color", async () => {
    await linkColor("i1", "c1");
    await unlinkColor("i1", "c1");

    expect(apiRequest).toHaveBeenNthCalledWith(1, "/api/items/i1/colors/c1", { method: "PUT" });
    expect(apiRequest).toHaveBeenNthCalledWith(2, "/api/items/i1/colors/c1", { method: "DELETE" });
  });
});
