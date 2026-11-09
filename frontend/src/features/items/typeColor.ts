import type { CSSProperties } from "react";
import type { Template } from "./types";

// Sets the CSS variable --type-color to the color of an item type, read from the template.
// CSS then uses var(--type-color, <fallback>), so an unknown type (no style) gets the fallback.
// Used on everything that shows a type's color: badges, item rows, category headings.
export function typeColorStyle(template: Template, typeKey: string): CSSProperties | undefined {
  const color = template.itemTypes.find((t) => t.key === typeKey)?.color;
  // React's CSSProperties type does not know custom properties (--name), hence the cast
  return color ? ({ "--type-color": color } as CSSProperties) : undefined;
}
