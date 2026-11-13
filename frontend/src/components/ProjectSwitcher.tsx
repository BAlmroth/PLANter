import { useEffect, useRef, useState } from "react";
import { Link, useMatch } from "react-router-dom";
import { useProjects } from "../features/projects/useProjects";
import styles from "./ProjectSwitcher.module.css";

// The pages that exist in every project. Switching project keeps you on the same page.
const KEEP_SECTIONS = ["moodboard", "plan", "tasks"];

type Props = { projectId: string | null };

// A dropdown in the header to jump between projects (and to the list or "New project"),
// so you never have to go back to the projects page first. It is a button and a list of links
// instead of a <select>, because the list of a <select> is drawn by the browser and cannot be styled.
// The header remounts it with key={projectId}, so the list is fetched again after switching,
// creating or deleting a project.
export function ProjectSwitcher({ projectId }: Props) {
  const { projects } = useProjects();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  // "plan" in /projects/<id>/plan/... (undefined on the overview)
  const section = useMatch("/projects/:projectId/:section/*")?.params.section;

  // Close the menu on Esc or on a click anywhere outside it
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onClick(event: MouseEvent) {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  // Hide it until the user has a project: "All projects" and "New project" are in the page itself
  if (projects.length === 0) return null;

  const current = projects.find((project) => project.id === projectId);
  const suffix = section && KEEP_SECTIONS.includes(section) ? `/${section}` : "";

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        type="button"
        className={styles.button}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.name}>{current?.name ?? "Projects"}</span>
        <span aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <nav className={styles.menu} aria-label="Switch project">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}${suffix}`}
              className={styles.option}
              aria-current={project.id === projectId ? "true" : undefined}
              onClick={() => setOpen(false)}
            >
              {project.name}
            </Link>
          ))}
          <hr className={styles.divider} />
          <Link to="/" className={styles.option} onClick={() => setOpen(false)}>
            All projects
          </Link>
          <Link to="/projects/new" className={styles.option} onClick={() => setOpen(false)}>
            + New project
          </Link>
        </nav>
      )}
    </div>
  );
}
