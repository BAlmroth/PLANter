import { Link } from "react-router-dom";
import type { useChecklist } from "./useChecklist";
import { getYetToPlan } from "./missingCategories";
import styles from "./YetToPlan.module.css";
import { Loader } from "../../components/Loader";

// At most this many lines, so the bulletin stays small. The rest is on the checklist page.
const LIMIT = 4;

type Props = {
  checklist: ReturnType<typeof useChecklist>;
  // Where "See full checklist" goes, relative to the page that shows the bulletin
  checklistPath: string;
};

// A short "Yet to plan" list: the categories the project has no item of yet, like tests or security.
// The page loads the checklist and passes it in, so the page decides when it is loaded again.
export function YetToPlan({ checklist, checklistPath }: Props) {
  const missing = getYetToPlan(checklist.checks);

  return (
    <section className={styles.bulletin} aria-labelledby="yet-to-plan">
      <h3 id="yet-to-plan" className={styles.title}>
        Yet to plan
      </h3>

      {checklist.loading && <Loader label="Checking…" size="inline" />}

      {checklist.error && (
        <div role="alert">
          <p className={styles.note}>{checklist.error}</p>
          <button type="button" onClick={checklist.refetch}>
            Try again
          </button>
        </div>
      )}

      {!checklist.loading && !checklist.error && (
        <>
          {missing.length === 0 ? (
            <p className={styles.note}>Every key category has at least one item.</p>
          ) : (
            <ul className={styles.list}>
              {missing.slice(0, LIMIT).map((check) => (
                <li key={check.key}>{check.label}</li>
              ))}
              {missing.length > LIMIT && <li className={styles.more}>and {missing.length - LIMIT} more</li>}
            </ul>
          )}
          <Link to={checklistPath} className={styles.link}>
            See full checklist →
          </Link>
        </>
      )}
    </section>
  );
}
