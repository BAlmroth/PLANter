import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError } from "../lib/api";
import { deleteProject, updateProject } from "../features/projects/projectsApi";
import { ProjectForm } from "../features/projects/ProjectForm";
import { useProject } from "../features/projects/useProject";
import { FileView } from "../features/items/FileView";
import { MapView } from "../features/map/MapView";

// Overview of one project, with edit and delete
export function ProjectPage() {
  const { projectId } = useParams() as { projectId: string };
  const navigate = useNavigate();
  const { project, error, loading, refetch, setProject } =
    useProject(projectId);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // Which view of the project is shown
  const [view, setView] = useState<"file" | "map">("file");

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

  // Not loading and no error, so there is a project
  if (!project) return null;

  async function handleDelete() {
    // TODO sprint 4: say what else is deleted (counts of items and tasks)
    if (
      !window.confirm(
        "Delete this project and everything in it? This cannot be undone.",
      )
    ) {
      return;
    }
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteProject(projectId);
      navigate("/");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError ? err.message : "Something went wrong.",
      );
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <main>
        <h1>Edit project</h1>
        {/* The form mounts here, after the project has loaded, so its start values are correct */}
        <ProjectForm
          initialValues={{
            name: project.name,
            description: project.description ?? "",
          }}
          submitLabel="Save changes"
          onSubmit={async ({ name, description }) => {
            try {
              // An empty description is sent as "" to clear it (the backend does not accept null)
              setProject(await updateProject(projectId, { name, description }));
              setEditing(false);
              return null;
            } catch (err) {
              return err instanceof ApiError
                ? err.message
                : "Something went wrong.";
            }
          }}
        />
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </main>
    );
  }

  return (
    <main>
      <h1>{project.name}</h1>
      {/* "" and null both mean no description */}
      <p>{project.description || "No description"}</p>
      <small>Created {new Date(project.createdAt).toLocaleString()}</small>

      <p>
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>{" "}
        <button type="button" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </p>
      {deleteError && <p role="alert">{deleteError}</p>}
      <p>
        <button type="button" onClick={() => setView("file")} disabled={view === "file"}>
          File view
        </button>{" "}
        <button type="button" onClick={() => setView("map")} disabled={view === "map"}>
          Map
        </button>
      </p>
      {view === "file" ? <FileView project={project} /> : <MapView project={project} />}

      <p>
        <Link to="/">Back to projects</Link>
      </p>
    </main>
  );
}
