import { describe, expect, it } from "vitest";
import { CARD_DIMENSIONS } from "./cardSize";
import { ITEM_GAP_HORIZONTAL, ITEM_GAP_VERTICAL, LEVEL_GAP_HORIZONTAL, LEVEL_GAP_VERTICAL, tidyLayout } from "./tidyLayout";
import type { CardSize } from "./cardSize";

const item = (id: string, size?: CardSize) => ({ id, size });
const edge = (sourceItemId: string, targetItemId: string) => ({ sourceItemId, targetItemId });
const M = CARD_DIMENSIONS.medium;
const L = CARD_DIMENSIONS.large;

describe("tidyLayout", () => {
  it("puts the target of a connection one column to the right of its source", () => {
    const p = tidyLayout([item("a"), item("b")], [edge("a", "b")]);
    expect(p.get("a")).toEqual({ positionX: 0, positionY: 0 });
    expect(p.get("b")).toEqual({ positionX: M.width + LEVEL_GAP_HORIZONTAL, positionY: 0 });
  });

  it("uses the longest path for the level", () => {
    // a -> b -> c and a -> c: c is two columns away
    const p = tidyLayout([item("a"), item("b"), item("c")], [edge("a", "b"), edge("b", "c"), edge("a", "c")]);
    expect(p.get("c")!.positionX).toBe(2 * (M.width + LEVEL_GAP_HORIZONTAL));
  });

  it("keeps connected items near each other in the column", () => {
    // x1 -> y1, x2 -> y2, but y2 is listed before y1
    const p = tidyLayout(
      [item("x1"), item("x2"), item("y2"), item("y1")],
      [edge("x1", "y1"), edge("x2", "y2")],
    );
    expect(p.get("y1")!.positionY).toBe(p.get("x1")!.positionY);
    expect(p.get("y2")!.positionY).toBe(p.get("x2")!.positionY);
  });

  it("does not loop forever on a cycle", () => {
    const p = tidyLayout([item("a"), item("b")], [edge("a", "b"), edge("b", "a")]);
    expect(p.size).toBe(2);
  });

  it("parks unconnected items in their own column after the others", () => {
    const p = tidyLayout([item("a"), item("b"), item("lonely"), item("lonely2")], [edge("a", "b")]);
    const x = 2 * (M.width + LEVEL_GAP_HORIZONTAL);
    expect(p.get("lonely")).toEqual({ positionX: x, positionY: 0 });
    expect(p.get("lonely2")).toEqual({ positionX: x, positionY: M.height + ITEM_GAP_HORIZONTAL });
  });

  it("ignores a connection to itself and to unknown items", () => {
    const p = tidyLayout([item("a")], [edge("a", "a"), edge("a", "ghost")]);
    expect(p.get("a")).toEqual({ positionX: 0, positionY: 0 });
  });

  it("flows top to bottom in vertical mode", () => {
    const p = tidyLayout([item("a"), item("b"), item("c")], [edge("a", "b"), edge("a", "c")], "vertical");
    expect(p.get("a")).toEqual({ positionX: 0, positionY: 0 });
    expect(p.get("b")).toEqual({ positionX: 0, positionY: M.height + LEVEL_GAP_VERTICAL });
    expect(p.get("c")).toEqual({ positionX: M.width + ITEM_GAP_VERTICAL, positionY: M.height + LEVEL_GAP_VERTICAL });
  });

  it("makes room for large cards: the next column starts after the widest card", () => {
    const p = tidyLayout([item("page", "large"), item("small", "small"), item("c")], [edge("page", "c"), edge("small", "c")]);
    expect(p.get("c")!.positionX).toBe(L.width + LEVEL_GAP_HORIZONTAL);
    // The card below a large card starts after its height, so they do not overlap
    expect(p.get("small")!.positionY).toBe(L.height + ITEM_GAP_HORIZONTAL);
  });

  it("handles no items", () => {
    expect(tidyLayout([], []).size).toBe(0);
  });
});
