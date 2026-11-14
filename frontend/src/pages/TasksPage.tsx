import { useActiveSection } from "../components/useActiveSection";
import { ViewToggle } from "../components/ViewToggle";
import { useChecklist } from "../features/checklist/useChecklist";
import { YetToPlan } from "../features/checklist/YetToPlan";
import { ProgressSummary } from "../features/progress/ProgressSummary";
import { useProjectContext } from "../features/projects/useProjectContext";
import { TodoView } from "../features/tasks/TodoView";
import { ItemWarningsList } from "../features/warnings/ItemWarningsList";
import styles from "./TasksPage.module.css";
import { Loader } from "../components/Loader";
import { useGateLoading } from "../components/useLoadGate";

// How many item warnings are listed. The rest are on the checklist page.
const WARNING_LIMIT = 5;
// "../checklist": from /projects/:id/tasks up one level to /projects/:id/checklist
const CHECKLIST_PATH = "../checklist";

// The two sections. The value is also the element id the toggle scrolls to.
const SECTIONS = [
  { value: "progress-section", label: "Progress & warnings" },
  { value: "tasks-section", label: "Tasks & sprints" },
] as const;
type SectionId = (typeof SECTIONS)[number]["value"];
const SECTION_IDS = SECTIONS.map((section) => section.value);

// Tasks & progress: one page with two sections, progress and warnings first (what is missing is the
// first thing you see), tasks and sprints under it. The toggle at the top stays in view and jumps between them.
export function TasksPage() {
  const { project, progress, warnings } = useProjectContext();
  const checklist = useChecklist(project.id);
  useGateLoading(checklist.loading);
  const [active, setActive] = useActiveSection<SectionId>(SECTION_IDS, "progress-section");

  function jumpTo(id: SectionId) {
    // Mark it at once, the observer agrees when the scroll is done
    setActive(id);
    // Smooth scrolling, unless the user asked their system for less motion
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  // A task added, changed or deleted below can add or remove a warning above (an MVP item with no tasks)
  function reloadWarnings() {
    warnings.refetch();
    checklist.refetch();
  }

  return (
    <div className={styles.page}>
      <div className={styles.toggleBar}>
        <ViewToggle label="Jump to section" options={SECTIONS} value={active} onChange={jumpTo} />
      </div>

      <section id="progress-section" className={styles.section} aria-labelledby="progress-heading">
        <h2 id="progress-heading" className={styles.sectionTitle}>
          Progress & warnings
        </h2>

        <div className={styles.grid}>
          {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
          <div className={styles.card} data-tour="tasks-progress">
            {progress.loading && <Loader label="Loading progress…" size="inline" />}
            {progress.error && (
              <div role="alert">
                <p>{progress.error}</p>
                <button type="button" onClick={progress.refetch}>
                  Try again
                </button>
              </div>
            )}
            {progress.progress && <ProgressSummary progress={progress.progress} templateKey={project.template} />}
          </div>

          {/* The warnings column: what is missing on top, what is wrong with single items under it */}
          <div className={styles.column}>
            <div className={styles.card} data-tour="yet-to-plan">
              <YetToPlan checklist={checklist} checklistPath={CHECKLIST_PATH} />
            </div>

            <section className={styles.card} aria-labelledby="item-warnings" data-tour="item-warnings">
              <h3 id="item-warnings" className={styles.title}>
                Item warnings
                {!warnings.loading && !warnings.error && (
                  <span className={styles.count}>{warnings.warnings.length}</span>
                )}
              </h3>
              {warnings.loading && <Loader label="Checking…" size="inline" />}
              {warnings.error && (
                <div role="alert">
                  <p>{warnings.error}</p>
                  <button type="button" onClick={warnings.refetch}>
                    Try again
                  </button>
                </div>
              )}
              {!warnings.loading && !warnings.error && (
                <ItemWarningsList
                  projectId={project.id}
                  warnings={warnings.warnings}
                  limit={WARNING_LIMIT}
                  morePath={CHECKLIST_PATH}
                />
              )}
            </section>
          </div>
        </div>
      </section>

      {/* A tinted panel, so it is clear where the warnings end and the tasks begin */}
      <section
        id="tasks-section"
        className={`${styles.section} ${styles.tasksSection}`}
        aria-labelledby="tasks-heading"
        data-tour="tasks-section"
      >
        <h2 id="tasks-heading" className={styles.sectionTitle}>
          Tasks & sprints
        </h2>
        <TodoView project={project} onTasksChanged={reloadWarnings} />
      </section>
    </div>
  );
}
