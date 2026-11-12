import type { CSSProperties } from "react";

// Sets the CSS variable --group-color, read by the CSS of chips, swatches and map dots.
// React's CSSProperties type does not know custom properties (--name), hence the cast.
export function groupColorVar(color: string): CSSProperties {
  return { "--group-color": color } as CSSProperties;
}
