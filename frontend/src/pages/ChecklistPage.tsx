import { ITEM_WARNINGS_ID } from "../features/checklist/checkLinks";
import { CheckList } from "../features/checklist/CheckList";
import { useChecklist } from "../features/checklist/useChecklist";
import { useProjectContext } from "../features/projects/useProjectContext";
import { ItemWarningsList } from "../features/warnings/ItemWarningsList";
import styles from "./ChecklistPage.module.css";
import { Loader } from "../components/Loader";
import { useGateLoading } from "../components/useLoadGate";

// The full checklist: "Before you start programming" with every check (✓ or ✗), and every item warning.
// Reached from "See full checklist" and "and N more" on the Tasks & progress page, not from the nav.
export function ChecklistPage() {
  const { project, warnings } = useProjectContext();
  const checklist = useChecklist(project.id);
  useGateLoading(checklist.loading);

  const categoryChecks = checklist.checks.filter((check) => check.kind === "category");
  const readinessChecks = checklist.checks.filter((check) => check.kind === "readiness");
  const passed = checklist.checks.filter((check) => check.passed).length;

  return (
    <div className={styles.page}>
      {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
      <section className={styles.card} aria-labelledby="before-you-start" data-tour="checklist-checks">
        <div className={styles.header}>
          <h2 id="before-you-start" className={styles.heading}>
            Before you start programming
          </h2>
          {!checklist.loading && !checklist.error && (
            <span className={styles.summary}>
              {passed} of {checklist.checks.length} done
            </span>
          )}
        </div>
        <p className={styles.intro}>The things that are easy to forget until the end. Each one links to where you fix it.</p>

        {checklist.loading && <Loader label="Checking…" size="inline" />}
        {checklist.error && (
          <div role="alert">
            <p>{checklist.error}</p>
            <button type="button" onClick={checklist.refetch}>
              Try again
            </button>
          </div>
        )}
        {!checklist.loading && !checklist.error && (
          <div className={styles.groups}>
            <CheckList title="Categories" checks={categoryChecks} />
            <CheckList title="Ready to build" checks={readinessChecks} />
          </div>
        )}
      </section>

      {/* ITEM_WARNINGS_ID: the "See item warnings ↓" link of the connections check jumps here */}
      <section
        id={ITEM_WARNINGS_ID}
        className={styles.card}
        aria-labelledby="all-item-warnings"
        data-tour="checklist-warnings"
      >
        <div className={styles.header}>
          <h2 id="all-item-warnings" className={styles.heading}>
            Item warnings
          </h2>
          {!warnings.loading && !warnings.error && <span className={styles.summary}>{warnings.warnings.length}</span>}
        </div>

        {warnings.loading && <Loader label="Checking…" size="inline" />}
        {warnings.error && (
          <div role="alert">
            <p>{warnings.error}</p>
            <button type="button" onClick={warnings.refetch}>
              Try again
            </button>
          </div>
        )}
        {/* No limit here: this is the page that shows all of them */}
        {!warnings.loading && !warnings.error && <ItemWarningsList projectId={project.id} warnings={warnings.warnings} />}
      </section>
    </div>
  );
}
