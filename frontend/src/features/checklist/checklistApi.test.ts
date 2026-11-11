import { afterEach, describe, expect, it, vi } from "vitest";

// checklistApi only builds the path for apiRequest, so apiRequest is replaced with a fake
const apiRequest = vi.hoisted(() => vi.fn());
vi.mock("../../lib/api", () => ({ apiRequest }));

import { getChecklist } from "./checklistApi";

afterEach(() => {
  vi.clearAllMocks();
});

describe("checklistApi", () => {
  it("getChecklist calls the checklist path of the project", async () => {
    await getChecklist("p1");
    expect(apiRequest).toHaveBeenCalledWith("/api/projects/p1/checklist");
  });
});
