import type { Box } from "./placeCard";

// The labels with arrows on the welcome screen (like Amazon's "new navigation bar ↖").
// Each one points at an element with a data-tour attribute, the same ones the tours use.
export type WelcomeMark = {
  target: string;
  text: string;
  // Where on the element the arrow points: 0..1 of its width and height ({ x: 0.5, y: 1 } = bottom center)
  anchor: { x: number; y: number };
  // Where the label sits, in px from that point
  offset: { x: number; y: number };
};

export const WELCOME_MARKS: WelcomeMark[] = [
  { target: "project-nav", text: "The parts of your plan", anchor: { x: 0.3, y: 1 }, offset: { x: -40, y: 90 } },
  { target: "sidebar", text: "Everything you have planned, by category", anchor: { x: 1, y: 0.2 }, offset: { x: 90, y: 30 } },
  { target: "progress", text: "How far you have come", anchor: { x: 0.5, y: 1 }, offset: { x: -30, y: 90 } },
  { target: "help-button", text: "Help and tours, any time", anchor: { x: 0, y: 0.5 }, offset: { x: -110, y: -70 } },
];

type Point = { x: number; y: number };

export type MarkGeometry = {
  // The point on the label's edge that faces the element, and how the label hangs from it
  label: Point & { align: "left" | "right" | "top" | "bottom" };
  // A curved arrow: from the label, bending through `control`, to just before the element
  arrow: { from: Point; control: Point; to: Point };
};

const LABEL_GAP = 8; // between the label and the start of the arrow
const TARGET_GAP = 8; // between the arrow's tip and the element
const BEND = 0.25; // how much the arrow curves (share of its length)

// Where the label and its arrow go for one element. Pure function, no DOM: easy to test.
export function markGeometry(box: Box, mark: WelcomeMark): MarkGeometry {
  const anchor = { x: box.left + box.width * mark.anchor.x, y: box.top + box.height * mark.anchor.y };
  const label = { x: anchor.x + mark.offset.x, y: anchor.y + mark.offset.y };

  // The label hangs from the side facing the element: a label to the right of it is left-aligned, and so on
  const horizontal = Math.abs(mark.offset.x) > Math.abs(mark.offset.y);
  const align = horizontal ? (mark.offset.x > 0 ? "left" : "right") : mark.offset.y > 0 ? "top" : "bottom";

  // A straight line from label to element, shortened a little at both ends
  const dx = anchor.x - label.x;
  const dy = anchor.y - label.y;
  const length = Math.hypot(dx, dy) || 1;
  const unit = { x: dx / length, y: dy / length };
  const from = { x: label.x + unit.x * LABEL_GAP, y: label.y + unit.y * LABEL_GAP };
  const to = { x: anchor.x - unit.x * TARGET_GAP, y: anchor.y - unit.y * TARGET_GAP };

  // Bend it: move the middle sideways (at a right angle to the line), like a hand-drawn arrow
  const middle = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
  const control = { x: middle.x - unit.y * length * BEND, y: middle.y + unit.x * length * BEND };

  return { label: { ...label, align }, arrow: { from, control, to } };
}

// A mark is only drawn when its element is on screen
export function isOnScreen(box: Box, viewport: { width: number; height: number }): boolean {
  return box.width > 0 && box.top < viewport.height && box.top + box.height > 0 && box.left < viewport.width;
}
