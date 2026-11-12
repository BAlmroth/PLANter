import type { CSSProperties } from "react";
import type { Template } from "./types";

// Sets the CSS variable --type-color. CSS then uses var(--type-color, <fallback>),
// so no color (an unknown type) gives no style and the fallback is used.
export function typeColorVar(color: string | undefined): CSSProperties | undefined {
  // React's CSSProperties type does not know custom properties (--name), hence the cast
  return color ? ({ "--type-color": color } as CSSProperties) : undefined;
}

// The color of an item type, read from the template. undefined for an unknown type.
export function getTypeColor(template: Template, typeKey: string): string | undefined {
  return template.itemTypes.find((t) => t.key === typeKey)?.color;
}

// --type-color for an item type. Used on everything that shows a type's color:
// badges, item rows, category headings.
export function typeColorStyle(template: Template, typeKey: string): CSSProperties | undefined {
  return typeColorVar(getTypeColor(template, typeKey));
}
