import { useItems } from "../features/items/useItems";
import { FileView } from "../features/items/FileView";
import { MapView } from "../features/map/MapView";
import { InspirationPageCard } from "../features/projects/InspirationPageCard";
import { PlanViewToggle } from "../features/projects/PlanViewToggle";
import { usePlanView } from "../features/projects/usePlanView";
import { ProjectDescriptionCard } from "../features/projects/ProjectDescriptionCard";
import { useProjectContext } from "../features/projects/useProjectContext";
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

// The list and the map show the same items, so they share one page. The List / Map toggle is in a row at the top of the page.
export function PlanPage() {
  const { project, warnings, progress } = useProjectContext();
  const { view } = usePlanView();
  // Loaded here so the title row can show the count. The list gets it as a prop.
  const items = useItems(project.id);
  const loaded = !items.loading && !items.error;

  return (
    <div className={styles.page}>
      <div className={styles.viewRow}>
        <div className={styles.viewHeading}>
          <h2 className={styles.viewTitle}>Project items</h2>
          {loaded && <span className={styles.count}>{items.items.length} items</span>}
        </div>
        <div data-tour="plan-view-toggle">
          <PlanViewToggle />
        </div>
      </div>
      {view === "list" ? (
        <FileView
          project={project}
          items={items}
          warnings={warnings.byItem}
          progress={progress.progress}
          onItemAdded={progress.refetch}
        />
      ) : (
        <MapView project={project} warnings={warnings.byItem} />
      )}
    </div>
  );
}
