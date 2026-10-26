import { Link, useParams } from "react-router-dom";
import { ItemDetail } from "../features/items/ItemDetail";
import { useProject } from "../features/projects/useProject";

// The detail view of one item: /projects/:projectId/items/:itemId
export function ItemPage() {
  const { projectId, itemId } = useParams() as { projectId: string; itemId: string };
  // The project is needed for its template key and name
  const { project, error, loading, refetch } = useProject(projectId);

  if (loading) {
    return (
      <main>
        <p>Loading…</p>
      </main>
    );
  }

  if (error) {
    // 404: not found or not yours. 400: the id in the URL is not a valid uuid.
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
      <ItemDetail project={project} itemId={itemId} />
    </main>
  );
}
