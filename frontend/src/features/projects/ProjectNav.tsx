import { NavLink } from "react-router-dom";
import styles from "./ProjectNav.module.css";

type Props = { projectId: string };

// The links to the pages of a project. Shown in the header while a project is open.
export function ProjectNav({ projectId }: Props) {
  // NavLink adds the "active" class to the link of the page we are on. "end" on the overview link
  // stops it from also matching /plan, /tasks and so on.
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    isActive ? `${styles.link} ${styles.active}` : styles.link;
  const base = `/projects/${projectId}`;

  return (
    <nav className={styles.nav} aria-label="Project pages">
      <NavLink to={base} end className={linkClass}>
        Overview
      </NavLink>
      <NavLink to={`${base}/moodboard`} className={linkClass}>
        Moodboard
      </NavLink>
      <NavLink to={`${base}/plan`} className={linkClass}>
        Items
      </NavLink>
      <NavLink to={`${base}/tasks`} className={linkClass}>
        Tasks & progress
      </NavLink>
    </nav>
  );
}
