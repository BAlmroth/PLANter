import { useLocation } from "react-router-dom";
import { Breadcrumb, type Crumb } from "../../components/Breadcrumb";
import { ProgressBar } from "../progress/ProgressBar";
import type { Progress } from "../progress/types";
import { PlanViewToggle } from "./PlanViewToggle";
import { ProjectSettings } from "./ProjectSettings";
import type { Project } from "./types";
import type { ItemCrumb } from "./useProjectContext";
import styles from "./ProjectSubHeader.module.css";

type Props = {
  project: Project;
  progress: Progress | null; // null while loading
  itemCrumb: ItemCrumb | null; // set by the item page, null on every other page
};

// The title of each page under /projects/:projectId, by the first part of the address after the project id
const PAGE_TITLES: Record<string, string> = {
  description: "Description",
  moodboard: "Moodboard",
  plan: "Items",
  tasks: "Tasks",
  progress: "Progress",
};

// The bar under the header on every project page: the trail and title of the page we are on, and the progress.
export function ProjectSubHeader({ project, progress, itemCrumb }: Props) {
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
        <Breadcrumb crumbs={crumbs} />
        <h1 className={styles.title}>{title}</h1>
      </div>

      {/* Next to the title, at the left */}
      {section === "plan" && <PlanViewToggle />}

      <div className={styles.right}>
        {progress && <ProgressBar progress={progress} label="Project progress" />}
        <ProjectSettings project={project} />
      </div>
    </div>
  );
}
