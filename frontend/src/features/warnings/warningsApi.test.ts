import { afterEach, describe, expect, it, vi } from "vitest";

// warningsApi only builds the path for apiRequest, so apiRequest is replaced with a fake
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { getWarnings } from "./warningsApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("warningsApi", () => {
  it("getWarnings calls the warnings path of the project", async () => {
    await getWarnings("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/warnings");
  });
});
