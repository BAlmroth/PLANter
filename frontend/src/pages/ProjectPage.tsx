import { useEffect, useRef, useState } from "react";
import {
  Outlet,
  useLocation,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { pageKeyFromPath } from "../features/help/pageHelp";
import { HelpButton } from "../features/tour/HelpButton";
import { Tour } from "../features/tour/Tour";
import { TOURS } from "../features/tour/tourSteps";
import { useTour } from "../features/tour/useTour";
import { FileSidebar } from "../features/items/FileSidebar";
import { useProgress } from "../features/progress/useProgress";
import { useWarnings } from "../features/warnings/useWarnings";
import { ProjectSubHeader } from "../features/projects/ProjectSubHeader";
import type { Project } from "../features/projects/types";
import type {
  ItemCrumb,
  ProjectContext,
} from "../features/projects/useProjectContext";
import { useProject } from "../features/projects/useProject";
import { LoadGate } from "../components/LoadGate";
import { useGateLoading, useLoadGate } from "../components/useLoadGate";
import styles from "./ProjectPage.module.css";
import { Loader } from "../components/Loader";
import { ErrorPage } from "../components/ErrorPage";
import { errorKindFromStatus } from "../components/errorContent";

// Everything under /projects/:projectId. Loads the project, then shows the frame around the pages.
export function ProjectPage() {
  const { projectId } = useParams() as { projectId: string };
  const { project, error, loading, refetch, setProject } =
    useProject(projectId);

  if (loading) {
    return (
      <main className={styles.message}>
        <Loader label="Loading project…" size="page" />
      </main>
    );
  }

  if (error) {
    // 404: not found or not yours. 400: the id in the URL is not a valid uuid. Both are a 404 page.
    const kind = errorKindFromStatus(error.status);
    return (
      <ErrorPage
        kind={kind}
        detail={error.message}
        // Trying again does not help when the project does not exist
        onRetry={kind === "notFound" ? undefined : refetch}
      />
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

  // Nothing on the project pages is shown until everything on them has loaded. "outer" holds the
  // whole frame the first time, "main" holds the page in the middle each time the user changes page.
  const outer = useLoadGate();
  const main = useLoadGate();
  useGateLoading(progress.loading || warnings.loading, outer.gate);
  useGateLoading(main.pending, outer.gate);

  const context: ProjectContext = {
    project,
    setProject,
    progress,
    warnings,
    setItemCrumb,
  };

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
    <LoadGate
      gate={outer.gate}
      pending={outer.pending}
      label="Loading project…"
      instant
    >
      <div className={styles.project}>
        <ProjectSubHeader
          project={project}
          progress={progress.progress}
          itemCrumb={itemCrumb}
          helpPage={helpPage}
        />

        <div className={styles.body}>
          <aside className={styles.sidebar} data-tour="sidebar">
            {/* Stays mounted when the page changes, so it does not jump. It has its own refresh button. */}
            <FileSidebar project={project} />
          </aside>

          <main className={styles.main}>
            <LoadGate gate={main.gate} pending={main.pending}>
              <Outlet context={context} />
            </LoadGate>
          </main>
        </div>

        <HelpButton
          onShowTour={helpPage ? tour.start : undefined}
          onRestart={tour.restart}
          templateKey={project.template}
        />
        {/* key: a new page starts a fresh Tour, so nothing from the last page's step is kept */}
        {helpPage && tour.index !== null && !outer.pending && !main.pending && (
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
    </LoadGate>
  );
}
