import { Link } from "react-router-dom";
import type { Project } from "./types";

// One row in the projects list. User text is rendered as plain text only (React escapes it).
export function ProjectCard({ project }: { project: Project }) {
  return (
    <li>
      <h2>
        <Link to={`/projects/${project.id}`}>{project.name}</Link>
      </h2>
      <p>{project.description || "No description"}</p>
      <small>Created {new Date(project.createdAt).toLocaleString()}</small>
    </li>
  );
}
