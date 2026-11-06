import { afterEach, describe, expect, it, vi } from "vitest";

// itemDetailsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import {
  createItemDetail,
  deleteItemDetail,
  listItemDetails,
  updateItemDetail,
  uploadItemDetailImage,
} from "./itemDetailsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("itemDetailsApi", () => {
  it("listItemDetails calls the item's details path", async () => {
    await listItemDetails("i1");
    expect(apiRequest).toHaveBeenCalledWith("/api/items/i1/details");
  });

  it("createItemDetail posts the input to the item's details", async () => {
    await createItemDetail("i1", { title: "Nice login", url: "https://example.com" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/items/i1/details");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ title: "Nice login", url: "https://example.com" });
  });

  it("updateItemDetail patches the row by id", async () => {
    await updateItemDetail("d1", { url: "" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/item-details/d1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ url: "" });
  });

  it("uploadItemDetailImage puts the file as the body with its own Content-Type", async () => {
    const file = new File(["x"], "mood.png", { type: "image/png" });
    await uploadItemDetailImage("d1", file);

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/item-details/d1/image");
    expect(options.method).toBe("PUT");
    expect(options.headers).toEqual({ "Content-Type": "image/png" });
    expect(options.body).toBe(file);
  });

  it("deleteItemDetail deletes by id", async () => {
    await deleteItemDetail("d1");
    expect(apiRequest).toHaveBeenCalledWith("/api/item-details/d1", { method: "DELETE" });
  });
});
