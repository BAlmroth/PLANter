import { Link } from "react-router-dom";
import styles from "./ProjectCard.module.css";
import type { Project } from "./types";

// One project in the list. User text is rendered as plain text only (React escapes it).
export function ProjectCard({ project }: { project: Project }) {
  return (
    <li className={styles.card}>
      <h2 className={styles.title}>
        {/* The link's ::after covers the whole card (see the CSS), so the whole card is clickable */}
        <Link to={`/projects/${project.id}`} className={styles.link}>
          {project.name}
        </Link>
      </h2>
      {/* "" and null both mean no description */}
      <p className={styles.description}>{project.description || "No description"}</p>
      <div className={styles.footer}>
        <span className={styles.tag}>{project.template}</span>
        <small>Created {new Date(project.createdAt).toLocaleDateString()}</small>
      </div>
    </li>
  );
}