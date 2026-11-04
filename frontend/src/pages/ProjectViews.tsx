import { FileView } from "../features/items/FileView";
import { MapView } from "../features/map/MapView";
import { ProgressOverview } from "../features/progress/ProgressOverview";
import { InspirationPageCard } from "../features/projects/InspirationPageCard";
import { ProjectDescriptionCard } from "../features/projects/ProjectDescriptionCard";
import { useProjectContext } from "../features/projects/useProjectContext";
import { TodoView } from "../features/tasks/TodoView";

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

export function FilesPage() {
  const { project, warnings } = useProjectContext();
  return <FileView project={project} warnings={warnings.byItem} />;
}

export function MapPage() {
  const { project, warnings } = useProjectContext();
  return <MapView project={project} warnings={warnings.byItem} />;
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
