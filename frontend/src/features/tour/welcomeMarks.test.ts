import { describe, expect, it } from "vitest";
import { isOnScreen, markGeometry, type WelcomeMark } from "./welcomeMarks";

const box = { top: 100, left: 100, width: 200, height: 40 };

describe("markGeometry", () => {
  it("puts a label below the element top-aligned, with the arrow pointing up at it", () => {
    const mark: WelcomeMark = { target: "x", text: "", anchor: { x: 0.5, y: 1 }, offset: { x: 0, y: 100 } };
    const { label, arrow } = markGeometry(box, mark);
    // The bottom center of the box is (200, 140), so the label is at (200, 240)
    expect(label).toEqual({ x: 200, y: 240, align: "top" });
    // Straight up: starts 8px above the label, ends 8px below the element
    expect(arrow.from).toEqual({ x: 200, y: 232 });
    expect(arrow.to).toEqual({ x: 200, y: 148 });
  });

  it("left-aligns a label to the right of the element", () => {
    const mark: WelcomeMark = { target: "x", text: "", anchor: { x: 1, y: 0.5 }, offset: { x: 90, y: 20 } };
    expect(markGeometry(box, mark).label.align).toBe("left");
  });

  it("right-aligns a label to the left of the element", () => {
    const mark: WelcomeMark = { target: "x", text: "", anchor: { x: 0, y: 0.5 }, offset: { x: -110, y: -70 } };
    expect(markGeometry(box, mark).label.align).toBe("right");
  });

  it("bends the arrow: the control point is off the straight line", () => {
    const mark: WelcomeMark = { target: "x", text: "", anchor: { x: 0.5, y: 1 }, offset: { x: 0, y: 100 } };
    const { arrow } = markGeometry(box, mark);
    expect(arrow.control.x).not.toBe(200);
  });
});

describe("isOnScreen", () => {
  const viewport = { width: 1000, height: 800 };

  it("is true for a visible element and false for one scrolled away or hidden", () => {
    expect(isOnScreen(box, viewport)).toBe(true);
    expect(isOnScreen({ ...box, top: 900 }, viewport)).toBe(false);
    expect(isOnScreen({ ...box, top: -100, height: 50 }, viewport)).toBe(false);
    expect(isOnScreen({ ...box, width: 0 }, viewport)).toBe(false);
  });
});
