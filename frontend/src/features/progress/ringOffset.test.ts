import { describe, expect, it } from "vitest";
import { ringOffset } from "./ringOffset";

describe("ringOffset", () => {
  it("hides the whole circle at 0%", () => {
    expect(ringOffset(0, 100)).toBe(100);
  });

  it("shows the whole circle at 100%", () => {
    expect(ringOffset(100, 100)).toBe(0);
  });

  it("hides the part that is not done", () => {
    expect(ringOffset(60, 200)).toBe(80);
  });

  it("clamps values outside 0–100", () => {
    expect(ringOffset(-10, 100)).toBe(100);
    expect(ringOffset(150, 100)).toBe(0);
  });
});
