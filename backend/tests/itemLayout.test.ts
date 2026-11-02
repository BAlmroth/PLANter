import { describe, expect, it } from "vitest";
import { COLUMN_WIDTH, ROW_HEIGHT, startPosition } from "../src/services/itemLayout.js";

const keys = ["page", "component", "function"];

describe("startPosition", () => {
  it("puts the first item of the first type at the top left", () => {
    expect(startPosition(keys, "page", [])).toEqual({ positionX: 0, positionY: 0 });
  });

  it("uses one column per type, in template order", () => {
    expect(startPosition(keys, "function", [])).toEqual({ positionX: 2 * COLUMN_WIDTH, positionY: 0 });
  });

  it("stacks items of the same type by row", () => {
    const existing = [{ positionX: COLUMN_WIDTH, positionY: 0 }];
    expect(startPosition(keys, "component", existing)).toEqual({
      positionX: COLUMN_WIDTH,
      positionY: ROW_HEIGHT,
    });
  });

  it("fills a gap left by a deleted item instead of overlapping", () => {
    // Rows 1 and 2 are taken, row 0 was deleted
    const existing = [
      { positionX: 0, positionY: ROW_HEIGHT },
      { positionX: 0, positionY: 2 * ROW_HEIGHT },
    ];
    expect(startPosition(keys, "page", existing)).toEqual({ positionX: 0, positionY: 0 });
  });

  it("ignores items that were moved somewhere else", () => {
    expect(startPosition(keys, "page", [{ positionX: 500, positionY: 40 }])).toEqual({
      positionX: 0,
      positionY: 0,
    });
  });
});
