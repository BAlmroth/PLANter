// Where the tour card goes next to the highlighted element. Pure function, no DOM: easy to test.

export type Placement = "top" | "bottom" | "left" | "right";
export type Box = { top: number; left: number; width: number; height: number };
type Size = { width: number; height: number };

export type CardPlacement = {
  top: number;
  left: number;
  placement: Placement;
  // Where the little arrow sits along the card's edge (px from the card's top or left), pointing at the element
  arrowOffset: number;
};

const GAP = 14; // between the element and the card (room for the arrow)
const MARGIN = 12; // the card never comes closer than this to the window edge
const ARROW_INSET = 18; // the arrow never sits in the card's rounded corner

const OPPOSITE: Record<Placement, Placement> = { top: "bottom", bottom: "top", left: "right", right: "left" };

// Is there room for the card on this side of the element?
function fits(side: Placement, target: Box, card: Size, viewport: Size): boolean {
  switch (side) {
    case "bottom":
      return target.top + target.height + GAP + card.height + MARGIN <= viewport.height;
    case "top":
      return target.top - GAP - card.height - MARGIN >= 0;
    case "right":
      return target.left + target.width + GAP + card.width + MARGIN <= viewport.width;
    case "left":
      return target.left - GAP - card.width - MARGIN >= 0;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));

// Tries the preferred side, then the opposite one, then the rest. When nothing fits (a huge element,
// a tiny window), the card goes below and is pushed into the window, possibly over the element.
export function placeCard(target: Box, card: Size, viewport: Size, preferred: Placement = "bottom"): CardPlacement {
  const order: Placement[] = [preferred, OPPOSITE[preferred], "bottom", "top", "right", "left"];
  const placement = order.find((side) => fits(side, target, card, viewport)) ?? "bottom";

  const centerX = target.left + target.width / 2;
  const centerY = target.top + target.height / 2;

  let top: number;
  let left: number;
  if (placement === "top" || placement === "bottom") {
    top = placement === "bottom" ? target.top + target.height + GAP : target.top - GAP - card.height;
    left = centerX - card.width / 2;
  } else {
    left = placement === "right" ? target.left + target.width + GAP : target.left - GAP - card.width;
    top = centerY - card.height / 2;
  }

  // Keep the whole card inside the window
  top = clamp(top, MARGIN, viewport.height - card.height - MARGIN);
  left = clamp(left, MARGIN, viewport.width - card.width - MARGIN);

  // The arrow points at the element's center, even when the card was pushed sideways
  const arrowOffset =
    placement === "top" || placement === "bottom"
      ? clamp(centerX - left, ARROW_INSET, card.width - ARROW_INSET)
      : clamp(centerY - top, ARROW_INSET, card.height - ARROW_INSET);

  return { top, left, placement, arrowOffset };
}
