import { afterEach, describe, expect, it, vi } from "vitest";

// progressApi only builds the path for apiRequest, so apiRequest is replaced with a fake
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { getProgress } from "./progressApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("progressApi", () => {
  it("getProgress calls the progress path of the project", async () => {
    await getProgress("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/progress");
  });
});
