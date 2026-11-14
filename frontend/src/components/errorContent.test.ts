import { describe, expect, it } from "vitest";
import { errorKindFromStatus } from "./errorContent";

describe("errorKindFromStatus", () => {
  it("treats no answer (status 0) as offline", () => {
    expect(errorKindFromStatus(0)).toBe("offline");
  });

  it("treats 404 and 400 as not found", () => {
    expect(errorKindFromStatus(404)).toBe("notFound");
    expect(errorKindFromStatus(400)).toBe("notFound");
  });

  it("treats every 5xx as a server error", () => {
    expect(errorKindFromStatus(500)).toBe("server");
    expect(errorKindFromStatus(503)).toBe("server");
  });

  it("falls back to unknown for other statuses", () => {
    expect(errorKindFromStatus(401)).toBe("unknown");
    expect(errorKindFromStatus(409)).toBe("unknown");
  });
});
