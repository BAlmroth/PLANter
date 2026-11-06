import { NavLink } from "react-router-dom";
import { ProgressBar } from "../progress/ProgressBar";
import type { Progress } from "../progress/types";
import { ProjectSettings } from "./ProjectSettings";
import type { Project } from "./types";
import styles from "./ProjectSubHeader.module.css";

type Props = {
  project: Project;
  progress: Progress | null; // null while loading
  onNavigate: () => void; // called when a page link is clicked
};

// The bar under the header on every project page: name, progress and the page links.
export function ProjectSubHeader({ project, progress, onNavigate }: Props) {
  // NavLink adds the "active" class to the link of the page we are on. "end" on the overview link
  // stops it from also matching /map, /tasks and so on.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;

  return (
    <div className={styles.subHeader}>
      <h1 className={styles.name}>{project.name}</h1>
      {progress && <ProgressBar progress={progress} label="Project progress" />}

      <nav className={styles.nav} aria-label="Project pages">
        <NavLink to="" end className={linkClass} onClick={onNavigate}>
          Overview
        </NavLink>
      <NavLink to="inspiration" className={linkClass} onClick={onNavigate}>
        Inspiration
      </NavLink>
        <NavLink to="files" className={linkClass} onClick={onNavigate}>
          Files
        </NavLink>
        <NavLink to="map" className={linkClass} onClick={onNavigate}>
          Map
        </NavLink>
        <NavLink to="tasks" className={linkClass} onClick={onNavigate}>
          Tasks
        </NavLink>
        <NavLink to="progress" className={linkClass} onClick={onNavigate}>
          Progress
        </NavLink>
      </nav>

      <ProjectSettings project={project} />
    </div>
  );
}
