import { Link } from "react-router-dom";
import { GroupDots } from "../groups/GroupChip";
import type { Group } from "../groups/types";
import type { Connection } from "../relationships/connections";
import type { Warning } from "../warnings/types";
import { WarningBadge } from "../warnings/WarningBadge";
import { typeColorStyle } from "./typeColor";
import { StatusIcon } from "./StatusIcon";
import type { Item, Template } from "./types";
import styles from "./ItemRowCard.module.css";

type Props = {
  projectId: string;
  item: Item;
  // For the type color of the item
  template: Template;
  connections: Connection[];
  // The groups this item is in
  groups: Group[];
  // What might be missing on this item. Empty = no badge.
  warnings: Warning[];
};

// One item in the File view, kept short so a card can be scanned quickly. The item page shows everything:
// the full description, each connection, the tasks and the moodboard. Read-only: editing happens there.
export function ItemRow({ projectId, item, template, connections, groups, warnings }: Props) {
  // "uses Button, used by Home", shown as a tooltip on the connection count
  const connectionList = connections
    .map((connection) => `${connection.label} ${connection.otherTitle}`)
    .join(", ");

  return (
    // The strip on the left is in the item type's color (also in "Group" mode, where types are mixed)
    <li className={styles.row} style={typeColorStyle(template, item.type)}>
      <div className={styles.top}>
        {/* Icon only: StatusIcon then gives the status text to screen readers and as a tooltip */}
        <StatusIcon status={item.status} />
        <Link to={`/projects/${projectId}/items/${item.id}`} className={styles.title} title={item.title}>
          {item.title}
        </Link>
        <span className={styles.tags}>
          <GroupDots groups={groups} />
          {connections.length > 0 && (
            <span className={styles.connections} title={connectionList}>
              {connections.length} {connections.length === 1 ? "connection" : "connections"}
            </span>
          )}
          <WarningBadge messages={warnings.map((warning) => warning.message)} />
          {item.isMvp && <span className={styles.mvp}>MVP</span>}
        </span>
      </div>
      {item.description && (
        <p className={styles.description} title={item.description}>
          {item.description}
        </p>
      )}
    </li>
  );
}
