import { Link } from "react-router-dom";
import type { Connection } from "../relationships/connections";
import { STATUS_LABELS, type Item } from "./types";
import styles from "./ItemRowCard.module.css";

type Props = {
  projectId: string;
  item: Item;
  connections: Connection[];
};

// One item in the File view. Read-only: editing, deleting and connecting happen in the detail view.
export function ItemRow({ projectId, item, connections }: Props) {
  return (
    <li className={styles.row}>
      <div className={styles.top}>
        <Link to={`/projects/${projectId}/items/${item.id}`} className={styles.title}>
          {item.title}
        </Link>
        <span className={styles.tags}>
          {item.isMvp && <span className={`${styles.tag} ${styles.mvp}`}>MVP</span>}
          {/* The class has the same name as the status, for example styles.in_progress */}
          <span className={`${styles.tag} ${styles[item.status]}`}>{STATUS_LABELS[item.status]}</span>
        </span>
      </div>
      {item.description && <p className={styles.description}>{item.description}</p>}
      {connections.length > 0 && (
        <ul className={styles.connections}>
          {connections.map((connection) => (
            <li key={connection.id}>
              <span className={styles.relation}>{connection.label}</span> {connection.otherTitle}{" "}
              <span className={styles.type}>({connection.otherTypeLabel})</span>
            </li>
          ))}
        </ul>
      )}
    </li>
  );
}
