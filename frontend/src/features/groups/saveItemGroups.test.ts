import { afterEach, describe, expect, it, vi } from "vitest";

// The two group routes are replaced with fakes, so the tests can check which requests are sent
// and make one of them fail.
const { addItemToGroup, removeItemFromGroup } = vi.hoisted(() => ({
  addItemToGroup: vi.fn(),
  removeItemFromGroup: vi.fn(),
}));
vi.mock("./groupsApi", () => ({ addItemToGroup, removeItemFromGroup }));

import { saveItemGroups } from "./saveItemGroups";

afterEach(() => {
  vi.resetAllMocks();
});

describe("saveItemGroups", () => {
  it("only sends requests for the groups that changed", async () => {
    const result = await saveItemGroups("item1", ["nav", "forms"], ["forms", "footer"]);

    expect(addItemToGroup).toHaveBeenCalledTimes(1);
    expect(addItemToGroup).toHaveBeenCalledWith("footer", "item1");
    expect(removeItemFromGroup).toHaveBeenCalledTimes(1);
    expect(removeItemFromGroup).toHaveBeenCalledWith("nav", "item1");
    expect(result).toEqual({ groupIds: ["forms", "footer"], failed: false });
  });

  it("sends nothing when the choice did not change", async () => {
    const result = await saveItemGroups("item1", ["nav"], ["nav"]);

    expect(addItemToGroup).not.toHaveBeenCalled();
    expect(removeItemFromGroup).not.toHaveBeenCalled();
    expect(result).toEqual({ groupIds: ["nav"], failed: false });
  });

  it("keeps going after a failed request and reports the real result", async () => {
    addItemToGroup.mockImplementation(async (groupId: string) => {
      if (groupId === "nav") throw new Error("network");
    });

    const result = await saveItemGroups("item1", [], ["nav", "forms"]);

    // "forms" is still added, "nav" is not in the result
    expect(addItemToGroup).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ groupIds: ["forms"], failed: true });
  });

  it("keeps a group the item could not be removed from", async () => {
    removeItemFromGroup.mockRejectedValue(new Error("network"));

    const result = await saveItemGroups("item1", ["nav"], []);

    expect(result).toEqual({ groupIds: ["nav"], failed: true });
  });
});
