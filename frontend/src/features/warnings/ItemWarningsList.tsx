import { Link } from "react-router-dom";
import type { Warning } from "./types";
import styles from "./ItemWarningsList.module.css";

type Props = {
  projectId: string;
  warnings: Warning[];
  // At most this many lines. Leave out to show all of them (the checklist page).
  limit?: number;
  // Where "and N more" goes when the list is cut, for example the checklist page
  morePath?: string;
};

// Every item warning in one list ("Home: has no components"), so they are not only spread out
// as "!" badges over the list and the map. Each line links to its item, where it can be fixed.
export function ItemWarningsList({ projectId, warnings, limit, morePath }: Props) {
  if (warnings.length === 0) {
    return <p className={styles.note}>No item warnings. Every item has the connections it needs.</p>;
  }

  const shown = limit === undefined ? warnings : warnings.slice(0, limit);
  const hidden = warnings.length - shown.length;

  return (
    <ul className={styles.list}>
      {shown.map((warning) => (
        // One item can break two rules, so the key is the rule and the item together
        <li key={`${warning.rule}-${warning.itemId}`}>
          <Link to={`/projects/${projectId}/items/${warning.itemId}`} className={styles.item}>
            {warning.itemTitle}
          </Link>{" "}
          {warning.message}
        </li>
      ))}
      {hidden > 0 && (
        <li className={styles.more}>
          {morePath ? <Link to={morePath}>and {hidden} more</Link> : `and ${hidden} more`}
        </li>
      )}
    </ul>
  );
}
