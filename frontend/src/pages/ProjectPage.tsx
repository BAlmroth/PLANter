import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation, useParams, useSearchParams } from "react-router-dom";
import { pageKeyFromPath } from "../features/help/pageHelp";
import { HelpButton } from "../features/tour/HelpButton";
import { Tour } from "../features/tour/Tour";
import { TOURS } from "../features/tour/tourSteps";
import { useTour } from "../features/tour/useTour";
import { WelcomeOverlay } from "../features/tour/WelcomeOverlay";
import { FileSidebar } from "../features/items/FileSidebar";
import { useProgress } from "../features/progress/useProgress";
import { useWarnings } from "../features/warnings/useWarnings";
import { ProjectSubHeader } from "../features/projects/ProjectSubHeader";
import type { Project } from "../features/projects/types";
import type { ItemCrumb, ProjectContext } from "../features/projects/useProjectContext";
import { useProject } from "../features/projects/useProject";
import styles from "./ProjectPage.module.css";

// Everything under /projects/:projectId. Loads the project, then shows the frame around the pages.
export function ProjectPage() {
  const { projectId } = useParams() as { projectId: string };
  const { project, error, loading, refetch, setProject } = useProject(projectId);

  if (loading) {
    return (
      <main className={styles.message}>
        <p>Loading project…</p>
      </main>
    );
  }

  if (error) {
    // 404: not found or not yours. 400: the id in the URL is not a valid uuid. Same message for both.
    const notFound = error.status === 404 || error.status === 400;
    return (
      <main className={styles.message}>
        <h1>{notFound ? "Project not found" : "Could not load the project"}</h1>
        {!notFound && (
          <div role="alert">
            <p>{error.message}</p>
            <button type="button" onClick={refetch}>
              Try again
            </button>
          </div>
        )}
        <p>
          <Link to="/">Back to projects</Link>
        </p>
      </main>
    );
  }

  // Not loading and no error, so there is a project
  if (!project) return null;

  return <ProjectFrame project={project} setProject={setProject} />;
}

type FrameProps = { project: Project; setProject: (project: Project) => void };

// The sub header, the file list on the left, and the current page (overview, files, map, tasks,
// progress or an item) on the right.
function ProjectFrame({ project, setProject }: FrameProps) {
  // Shared by the sub header, the item list and the Tasks & progress page, so all show the same numbers
  const progress = useProgress(project.id);
  // Shared by the File view and the map, so both show the same badges
  const warnings = useWarnings(project.id);

  // Set by the item page, shown in the sub header
  const [itemCrumb, setItemCrumb] = useState<ItemCrumb | null>(null);

  const context: ProjectContext = { project, setProject, progress, warnings, setItemCrumb };

  // Items, connections and tasks may have changed when the user moves to another page, so ask
  // for fresh numbers and warnings. The ref skips the first render, where the hooks above
  // have just loaded everything.
  const { pathname } = useLocation();
  const lastPath = useRef(pathname);
  const { refetch: refetchProgress } = progress;
  const { refetch: refetchWarnings } = warnings;
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    refetchProgress();
    refetchWarnings();
  }, [pathname, refetchProgress, refetchWarnings]);

  // Which page's tour to show. The list and the map share a URL, so ?view= decides.
  const [searchParams] = useSearchParams();
  const helpPage = pageKeyFromPath(pathname, searchParams.get("view"));
  const tour = useTour(helpPage);

  return (
    <div className={styles.project}>
      <ProjectSubHeader project={project} progress={progress.progress} itemCrumb={itemCrumb} />

      <div className={styles.body}>
        <aside className={styles.sidebar} data-tour="sidebar">
          {/* Stays mounted when the page changes, so it does not jump. It has its own refresh button. */}
          <FileSidebar project={project} />
        </aside>

        <main className={styles.main}>
          <Outlet context={context} />
        </main>
      </div>

      <HelpButton onShowTour={helpPage ? tour.start : undefined} onRestart={tour.restart} />
      {tour.welcome && (
        <WelcomeOverlay onStart={tour.startFromWelcome} onDismiss={tour.dismissWelcome} onSkipAll={tour.skipAll} />
      )}
      {/* key: a new page starts a fresh Tour, so nothing from the last page's step is kept */}
      {helpPage && tour.index !== null && (
        <Tour
          key={helpPage}
          steps={TOURS[helpPage]}
          index={tour.index}
          direction={tour.direction}
          onStep={tour.onStep}
          onClose={tour.close}
          onSkipAll={tour.skipAll}
        />
      )}
    </div>
  );
}
