import { Link } from "react-router-dom";
import type { Group } from "../groups/types";
import type { Connection } from "../relationships/connections";
import type { Warning } from "../warnings/types";
import { WarningBadge } from "../warnings/WarningBadge";
import { TypeBadge } from "./TypeBadge";
import { typeColorStyle } from "./typeColor";
import { STATUS_LABELS, type Item, type Template } from "./types";
import styles from "./ItemRowCard.module.css";

type Props = {
  projectId: string;
  item: Item;
  // For the type colors of the item and its connections
  template: Template;
  connections: Connection[];
  // The groups this item is in
  groups: Group[];
  // What might be missing on this item. Empty = no badge.
  warnings: Warning[];
};

// One item in the File view. Read-only: editing, deleting and connecting happen in the detail view.
export function ItemRow({ projectId, item, template, connections, groups, warnings }: Props) {
  return (
    // The strip on the left is in the item type's color (also in "Group" mode, where types are mixed)
    <li className={styles.row} style={typeColorStyle(template, item.type)}>
      <div className={styles.top}>
        <Link to={`/projects/${projectId}/items/${item.id}`} className={styles.title}>
          {item.title}
        </Link>
        <span className={styles.tags}>
          <WarningBadge messages={warnings.map((warning) => warning.message)} />
          {item.isMvp && <span className={`${styles.tag} ${styles.mvp}`}>MVP</span>}
          {/* The class has the same name as the status, for example styles.in_progress */}
          <span className={`${styles.tag} ${styles[item.status]}`}>{STATUS_LABELS[item.status]}</span>
        </span>
      </div>
      {groups.length > 0 && <p className={styles.groups}>{groups.map((group) => group.name).join(", ")}</p>}
      {item.description && <p className={styles.description}>{item.description}</p>}
      {connections.length > 0 && (
        <ul className={styles.connections}>
          {connections.map((connection) => (
            <li key={connection.id}>
              <span className={styles.relation}>{connection.label}</span> {connection.otherTitle}{" "}
              <TypeBadge typeKey={connection.otherType} template={template} />
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
