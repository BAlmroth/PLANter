import { useSearchParams } from "react-router-dom";
import { FileView } from "../features/items/FileView";
import { MapView } from "../features/map/MapView";
import { ProgressOverview } from "../features/progress/ProgressOverview";
import { InspirationPageCard } from "../features/projects/InspirationPageCard";
import { ProjectDescriptionCard } from "../features/projects/ProjectDescriptionCard";
import { useProjectContext } from "../features/projects/useProjectContext";
import { TodoView } from "../features/tasks/TodoView";
import styles from "./PlanPage.module.css";

// The pages under /projects/:projectId. Each one picks the project (and shared data) out of the
// Outlet context that ProjectPage provides, and shows one view.

export function DescriptionPage() {
  const { project, setProject } = useProjectContext();
  return <ProjectDescriptionCard project={project} setProject={setProject} />;
}

export function InspirationPage() {
  const { project } = useProjectContext();
  return <InspirationPageCard projectId={project.id} />;
}

// The list and the map show the same items, so they share one page with a toggle. The choice is kept in
// the URL (?view=map), so a refresh or a shared link opens the same view. The list is the default.
export function PlanPage() {
  const { project, warnings } = useProjectContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const view = searchParams.get("view") === "map" ? "map" : "list";

  return (
    <div className={styles.page}>
      <div className={styles.toggle} role="group" aria-label="Plan view">
        {(["list", "map"] as const).map((option) => (
          <button
            key={option}
            type="button"
            className={option === view ? `${styles.option} ${styles.active}` : styles.option}
            aria-pressed={option === view}
            // replace: switching views should not fill up the back button history
            onClick={() => setSearchParams({ view: option }, { replace: true })}
          >
            {option === "list" ? "List" : "Map"}
          </button>
        ))}
      </div>
      {view === "list" ? (
        <FileView project={project} warnings={warnings.byItem} />
      ) : (
        <MapView project={project} warnings={warnings.byItem} />
      )}
    </div>
  );
}

export function TasksPage() {
  const { project } = useProjectContext();
  return <TodoView project={project} />;
}

export function ProgressPage() {
  const { project, progress } = useProjectContext();
  return (
    <>
      {progress.loading && <p>Loading progress…</p>}
      {progress.error && (
        <div role="alert">
          <p>{progress.error}</p>
          <button type="button" onClick={progress.refetch}>
            Try again
          </button>
        </div>
      )}
      {progress.progress && <ProgressOverview progress={progress.progress} templateKey={project.template} />}
    </>
  );
}
