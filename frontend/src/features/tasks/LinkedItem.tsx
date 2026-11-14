import { Link } from "react-router-dom";
import type { Item, Template } from "../items/types";
import { typeColorStyle } from "../items/typeColor";
import styles from "./LinkedItem.module.css";

type Props = {
  projectId: string;
  // Undefined when the item is not in the list (nothing is shown then)
  item: Item | undefined;
  // For the item type color and name. Without it (still loading) the pill is grey.
  template: Template | null;
};

// The item a task is about, as a link: a small chain icon and the item's title, in the item type's color.
// Used by both the list and the board, so a task looks the same in both. The tooltip and the screen
// reader say what it is ("Linked item (Page): Home").
export function LinkedItem({ projectId, item, template }: Props) {
  if (!item) return null;
  const typeLabel = template?.itemTypes.find((t) => t.key === item.type)?.label ?? "Unknown";
  return (
    <Link
      to={`/projects/${projectId}/items/${item.id}`}
      className={styles.linked}
      style={template ? typeColorStyle(template, item.type) : undefined}
      title={`Linked item (${typeLabel}): ${item.title}`}
    >
      <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
        {/* Two links of a chain */}
        <path
          d="M6.5 9.5 L9.5 6.5 M7 4.5 L8 3.5 A2.5 2.5 0 0 1 11.5 7 L10.5 8 M9 11.5 L8 12.5 A2.5 2.5 0 0 1 4.5 9 L5.5 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <span className={styles.visuallyHidden}>Linked item ({typeLabel}): </span>
      {item.title}
    </Link>
  );
}
