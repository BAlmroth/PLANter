import { StatusIcon } from "./StatusIcon";
import type { Item } from "./types";
import styles from "./ItemDetail.module.css";

type Props = {
  item: Item;
  // The label of the item's type, "Unknown" when the template does not have it
  typeLabel: string;
  connectionCount: number;
  doneTasks: number;
  totalTasks: number;
};

// The "Details" card on the item page: four small tiles with the item's key numbers.
export function ItemDetailsTiles({ item, typeLabel, connectionCount, doneTasks, totalTasks }: Props) {
  return (
    <section className={styles.card}>
      <h2 className={styles.cardTitle}>Details</h2>
      <dl className={styles.tiles}>
        <div className={styles.tile}>
          <dt className={styles.label}>Status</dt>
          <dd>
            <StatusIcon status={item.status} showLabel />
          </dd>
        </div>
        <div className={styles.tile}>
          <dt className={styles.label}>Type</dt>
          <dd>{typeLabel}</dd>
        </div>
        <div className={styles.tile}>
          <dt className={styles.label}>Connections</dt>
          <dd>{connectionCount}</dd>
        </div>
        <div className={styles.tile}>
          <dt className={styles.label}>Tasks done</dt>
          <dd>
            {doneTasks} / {totalTasks}
          </dd>
        </div>
      </dl>
    </section>
  );
}
