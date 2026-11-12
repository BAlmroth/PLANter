// @vitest-environment jsdom
// (a fake browser, so localStorage exists)
import { afterEach, describe, expect, it } from "vitest";
import { PAGE_HELP, type PageKey } from "../help/pageHelp";
import {
  TOURS,
  markTourSeen,
  markWelcomeSeen,
  resetTours,
  shouldAutoStart,
  shouldShowWelcome,
  skipAllTours,
} from "./tourSteps";

afterEach(() => localStorage.clear());

describe("tour steps", () => {
  it("has a tour for every page, starting with a card in the middle", () => {
    for (const page of Object.keys(PAGE_HELP) as PageKey[]) {
      expect(TOURS[page].length, page).toBeGreaterThan(0);
      expect(TOURS[page][0].target, page).toBeNull();
    }
  });
});

describe("when a tour starts by itself", () => {
  it("starts once per page", () => {
    expect(shouldAutoStart("list")).toBe(true);
    markTourSeen("list");
    expect(shouldAutoStart("list")).toBe(false);
    expect(shouldAutoStart("map")).toBe(true);
  });

  it("never starts after Skip tutorial", () => {
    skipAllTours();
    expect(shouldAutoStart("overview")).toBe(false);
  });

  it("starts everywhere again after a reset, even after Skip tutorial", () => {
    markTourSeen("list");
    skipAllTours();
    resetTours();
    expect(shouldAutoStart("list")).toBe(true);
    expect(shouldAutoStart("overview")).toBe(true);
  });
});

describe("the welcome screen", () => {
  it("shows once", () => {
    expect(shouldShowWelcome()).toBe(true);
    markWelcomeSeen();
    expect(shouldShowWelcome()).toBe(false);
  });

  it("does not show after Skip tutorial, and shows again after a reset", () => {
    skipAllTours();
    expect(shouldShowWelcome()).toBe(false);
    resetTours();
    expect(shouldShowWelcome()).toBe(true);
  });
});
