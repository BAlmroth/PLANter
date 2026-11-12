import { describe, expect, it } from "vitest";
import { placeCard } from "./placeCard";

const viewport = { width: 1200, height: 800 };
const card = { width: 300, height: 150 };

describe("placeCard", () => {
  it("puts the card below the element, centered, when there is room", () => {
    const target = { top: 100, left: 450, width: 300, height: 40 };
    expect(placeCard(target, card, viewport)).toEqual({ top: 154, left: 450, placement: "bottom", arrowOffset: 150 });
  });

  it("flips to the top when there is no room below", () => {
    const target = { top: 700, left: 450, width: 300, height: 40 };
    const result = placeCard(target, card, viewport);
    expect(result.placement).toBe("top");
    expect(result.top).toBe(700 - 14 - 150);
  });

  it("uses the preferred side when it fits", () => {
    const target = { top: 300, left: 100, width: 200, height: 200 };
    expect(placeCard(target, card, viewport, "right").placement).toBe("right");
  });

  it("keeps the card inside the window and moves the arrow to still point at the element", () => {
    // An element in the top-left corner: a centered card would stick out on the left
    const target = { top: 10, left: 0, width: 60, height: 30 };
    const result = placeCard(target, card, viewport);
    expect(result.left).toBe(12);
    expect(result.arrowOffset).toBe(18); // the element's center (30) is left of the card, so as far left as allowed
  });

  it("falls back to below, pushed into the window, when nothing fits", () => {
    const target = { top: 0, left: 0, width: 1200, height: 800 };
    const result = placeCard(target, card, viewport);
    expect(result.placement).toBe("bottom");
    expect(result.top).toBe(800 - 150 - 12);
  });
});
