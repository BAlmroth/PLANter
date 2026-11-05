import { afterEach, describe, expect, it, vi } from "vitest";

// inspirationsApi only builds the path and options for apiRequest, so apiRequest is replaced with a fake
// and these tests check what it was called with.
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import {
  createInspiration,
  deleteInspiration,
  listInspirations,
  updateInspiration,
  uploadInspirationImage,
} from "./inspirationsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("inspirationsApi", () => {
  it("listInspirations calls the project's inspirations path", async () => {
    await listInspirations("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/inspirations");
  });

  it("createInspiration posts the input to the project's inspirations", async () => {
    await createInspiration("p1", { title: "Nice site", url: "https://example.com" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/projects/p1/inspirations");
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ title: "Nice site", url: "https://example.com" });
  });

  it("updateInspiration patches the entry by id", async () => {
    await updateInspiration("i1", { title: "New", url: "" });

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/inspirations/i1");
    expect(options.method).toBe("PATCH");
    expect(JSON.parse(options.body)).toEqual({ title: "New", url: "" });
  });

  it("uploadInspirationImage puts the file as the body with its own Content-Type", async () => {
    const file = new File(["x"], "mood.png", { type: "image/png" });
    await uploadInspirationImage("i1", file);

    const [path, options] = apiRequest.mock.calls[0];
    expect(path).toBe("/api/inspirations/i1/image");
    expect(options.method).toBe("PUT");
    expect(options.headers).toEqual({ "Content-Type": "image/png" });
    expect(options.body).toBe(file);
  });

  it("deleteInspiration deletes by id", async () => {
    await deleteInspiration("i1");
    expect(apiRequest).toHaveBeenCalledWith("/api/inspirations/i1", { method: "DELETE" });
  });
});
