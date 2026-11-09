import type { CSSProperties } from "react";
import type { Template } from "./types";
import styles from "./TypeBadge.module.css";

type Props = {
  // The item's type key, for example "page"
  typeKey: string;
  template: Template;
};

// The item type as a pill in the type's color, for example a blue "Page".
// The color comes from the template, so no item types are hard-coded here.
export function TypeBadge({ typeKey, template }: Props) {
  const type = template.itemTypes.find((t) => t.key === typeKey);

  // React's CSSProperties type does not know custom properties (--name), hence the cast.
  // An unknown type sets no color, and the CSS falls back to grey.
  const style = type ? ({ "--type-color": type.color } as CSSProperties) : undefined;

  return (
    <span className={styles.badge} style={style}>
      {type?.label ?? "Unknown"}
    </span>
  );
}
