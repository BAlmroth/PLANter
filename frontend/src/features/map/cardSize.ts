// How big an item card is on the map. The template says which size a type has (presentation, like
// the color). The pixel sizes live here, in one place, because both the card (ItemNode) and the
// layout (tidyLayout) need them: the layout must know how much room a card takes.
import type { Template } from "../items/types";

export type CardSize = "small" | "medium" | "large";

// width: fixed, long titles wrap. height: about one line of title, used only to space the cards.
export const CARD_DIMENSIONS: Record<CardSize, { width: number; height: number }> = {
  small: { width: 120, height: 60 },
  medium: { width: 170, height: 80 },
  large: { width: 200, height: 150 },
};

// An unknown type, or a template without sizes, gets "medium"
export function getCardSize(template: Template, typeKey: string): CardSize {
  return template.itemTypes.find((type) => type.key === typeKey)?.size ?? "medium";
}
