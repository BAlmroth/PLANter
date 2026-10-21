import { Link, useParams } from "react-router-dom";
import { useProject } from "../features/projects/useProject";

// Overview of one project
export function ProjectPage() {
  const { projectId } = useParams() as { projectId: string };
  const { project, error, loading, refetch } = useProject(projectId);

  if (loading) {
    return (
      <main>
        <p>Loading project…</p>
      </main>
    );
  }

  if (error) {
    // 404: not found or not yours. 400: the id in the URL is not a valid uuid. Same message for both.
    const notFound = error.status === 404 || error.status === 400;
    return (
      <main>
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

  if (!project) return null;

  return (
    <main>
      <h1>{project.name}</h1>
      <p>{project.description || "No description"}</p>
      <small>Created {new Date(project.createdAt).toLocaleString()}</small>
      <p>
        <Link to="/">Back to projects</Link>
      </p>
    </main>
  );
}
