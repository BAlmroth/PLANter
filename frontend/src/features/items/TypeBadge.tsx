import type { Template } from "./types";
import { typeColorStyle } from "./typeColor";
import styles from "./TypeBadge.module.css";

type Props = {
  // The item's type key, for example "page"
  typeKey: string;
  template: Template;
};

// The item type as a pill in the type's color, for example a blue "Page".
// The color comes from the template, so no item types are hard-coded here.
// An unknown type gets a grey "Unknown" pill.
export function TypeBadge({ typeKey, template }: Props) {
  const label = template.itemTypes.find((t) => t.key === typeKey)?.label ?? "Unknown";
  return (
    <span className={styles.badge} style={typeColorStyle(template, typeKey)}>
      {label}
    </span>
  );
}
