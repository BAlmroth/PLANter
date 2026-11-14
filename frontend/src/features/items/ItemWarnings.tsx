import type { Warning } from "../warnings/types";
import styles from "./ItemDetail.module.css";

type Props = {
  itemTitle: string;
  // The warnings of this item only
  warnings: Warning[];
};

// The "Warnings" card on the item page: a count and one line per broken rule.
export function ItemWarnings({ itemTitle, warnings }: Props) {
  return (
    <section className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}>Warnings</h2>
        {warnings.length > 0 && <span className={styles.count}>{warnings.length}</span>}
      </div>
      {warnings.length === 0 ? (
        <p className={styles.empty}>Nothing looks missing.</p>
      ) : (
        <ul className={styles.warnings}>
          {warnings.map((warning) => (
            <li key={warning.rule} className={styles.warning}>
              {/* The message follows the item name, for example "Login has no components" */}
              <strong>{itemTitle}</strong> {warning.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
