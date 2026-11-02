import { describe, expect, it } from "vitest";
import { ApiError } from "../../lib/api";
import { getInvalidRelationshipCount } from "./typeChange";

describe("getInvalidRelationshipCount", () => {
  it("returns the count from a 409 answer", () => {
    const err = new ApiError(409, "Changing the type would delete connections", { invalidRelationships: 3 });
    expect(getInvalidRelationshipCount(err)).toBe(3);
  });

  it("returns null for other statuses", () => {
    const err = new ApiError(400, "Invalid", { invalidRelationships: 3 });
    expect(getInvalidRelationshipCount(err)).toBeNull();
  });

  it("returns null when a 409 has no count", () => {
    expect(getInvalidRelationshipCount(new ApiError(409, "Conflict"))).toBeNull();
    expect(getInvalidRelationshipCount(new ApiError(409, "Conflict", { invalidRelationships: "3" }))).toBeNull();
  });

  it("returns null for errors that are not ApiErrors", () => {
    expect(getInvalidRelationshipCount(new Error("boom"))).toBeNull();
    expect(getInvalidRelationshipCount(null)).toBeNull();
  });
});
