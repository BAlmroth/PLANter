import { useLocation } from "react-router-dom";
import { Breadcrumb, type Crumb } from "../../components/Breadcrumb";
import { InfoBubble } from "../../components/InfoBubble";
import { PAGE_HELP, type PageKey } from "../help/pageHelp";
import { ProgressBar } from "../progress/ProgressBar";
import type { Progress } from "../progress/types";
import { ProjectSettings } from "./ProjectSettings";
import type { Project } from "./types";
import type { ItemCrumb } from "./useProjectContext";
import styles from "./ProjectSubHeader.module.css";

type Props = {
  project: Project;
  progress: Progress | null; // null while loading
  itemCrumb: ItemCrumb | null; // set by the item page, null on every other page
  helpPage: PageKey | null; // which page's help the "i" next to the title shows, null = no "i"
};

// The title of each page under /projects/:projectId, by the first part of the address after the project id
const PAGE_TITLES: Record<string, string> = {
  description: "Description",
  moodboard: "Moodboard",
  plan: "Items",
  tasks: "Tasks & progress",
  checklist: "Checklist",
};

// The bar under the header on every project page: the trail and title of the page we are on, and the progress.
export function ProjectSubHeader({ project, progress, itemCrumb, helpPage }: Props) {
  // "/projects/<id>/tasks" -> ["", "projects", "<id>", "tasks"]
  const section = useLocation().pathname.split("/")[3] ?? "";
  const base = `/projects/${project.id}`;

  let title: string;
  let crumbs: Crumb[];

  if (section === "items") {
    // The item page sets itemCrumb once the item is loaded
    title = itemCrumb?.title ?? "Item";
    crumbs = [
      { label: project.name, to: base },
      { label: itemCrumb?.typeLabel ?? "Items", to: `${base}/plan?view=list` },
      { label: title },
    ];
  } else if (section === "checklist") {
    // The checklist is opened from Tasks & progress (not from the nav), so the trail goes back there
    title = PAGE_TITLES.checklist;
    crumbs = [
      { label: project.name, to: base },
      { label: PAGE_TITLES.tasks, to: `${base}/tasks` },
      { label: title },
    ];
  } else if (section === "") {
    title = "Overview";
    crumbs = [{ label: project.name }];
  } else {
    title = PAGE_TITLES[section] ?? "Overview";
    crumbs = [{ label: project.name, to: base }, { label: title }];
  }

  return (
    <div className={styles.subHeader}>
      <div className={styles.heading}>
        {/* Every trail starts at the projects list */}
        <Breadcrumb crumbs={[{ label: "Projects", to: "/" }, ...crumbs]} />
        <div className={styles.titleRow}>
          <h1 className={styles.title}>{title}</h1>
          {helpPage && <InfoBubble text={PAGE_HELP[helpPage].intro} label="About this page" />}
        </div>
      </div>

      <div className={styles.right}>
        {/* data-tour: the tutorial points at the progress */}
        {progress && (
          <div data-tour="progress">
            <ProgressBar progress={progress} label="Project progress" />
          </div>
        )}
        <ProjectSettings project={project} />
      </div>
    </div>
  );
}
