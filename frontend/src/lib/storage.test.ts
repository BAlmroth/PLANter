// @vitest-environment jsdom
// (a fake browser, so localStorage exists. The other tests run in plain Node.)
import { afterEach, describe, expect, it, vi } from "vitest";
import { clearFlags, readFlag, writeFlag } from "./storage";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("flags in localStorage", () => {
  it("is false until written, true after, and false again when unset", () => {
    expect(readFlag("intro:plan")).toBe(false);
    writeFlag("intro:plan", true);
    expect(readFlag("intro:plan")).toBe(true);
    writeFlag("intro:plan", false);
    expect(readFlag("intro:plan")).toBe(false);
  });

  it("clears only the flags in one group", () => {
    writeFlag("intro:plan", true);
    writeFlag("intro:tasks", true);
    writeFlag("tour:plan", true);
    localStorage.setItem("someone-else", "1");

    clearFlags("intro:");

    expect(readFlag("intro:plan")).toBe(false);
    expect(readFlag("intro:tasks")).toBe(false);
    expect(readFlag("tour:plan")).toBe(true);
    expect(localStorage.getItem("someone-else")).toBe("1");
  });

  it("does not throw when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => writeFlag("intro:plan", true)).not.toThrow();
    expect(readFlag("intro:plan")).toBe(false);
  });
});
