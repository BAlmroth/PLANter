import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../../components/useConfirm";
import { ApiError } from "../../lib/api";
import { OverviewCard } from "./OverviewCard";
import { ProjectForm } from "./ProjectForm";
import { deleteProject, updateProject } from "./projectsApi";
import type { Project } from "./types";
import styles from "./ProjectOverview.module.css";

type Props = { project: Project; setProject: (project: Project) => void };

// The project's name and description, with edit and delete (the Description page)
export function ProjectDescriptionCard({ project, setProject }: Props) {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const { confirm, modal } = useConfirm();

  async function handleDelete() {
    // TODO sprint 4: say what else is deleted (counts of items and tasks)
    const message = "This deletes the project and everything in it. This cannot be undone.";
    if (!(await confirm({ title: `Delete "${project.name}"?`, message }))) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteProject(project.id);
      navigate("/");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  if (editing) {
    return (
      <OverviewCard label="Desc">
        {/* The form mounts here, after the project has loaded, so its start values are correct */}
        <ProjectForm
          initialValues={{ name: project.name, description: project.description ?? "" }}
          submitLabel="Save changes"
          onSubmit={async ({ name, description }) => {
            try {
              // An empty description is sent as "" to clear it (the backend does not accept null)
              setProject(await updateProject(project.id, { name, description }));
              setEditing(false);
              return null;
            } catch (err) {
              return err instanceof ApiError ? err.message : "Something went wrong.";
            }
          }}
        />
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </OverviewCard>
    );
  }

  return (
    <OverviewCard label="Desc">
      {modal}
      <h3 className={styles.cardTitle}>{project.name}</h3>
      {/* "" and null both mean no description */}
      <p>{project.description || "No description"}</p>
      <small>Created {new Date(project.createdAt).toLocaleString()}</small>
      <div className={styles.actions}>
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" onClick={handleDelete} disabled={deleting}>
          {deleting ? "Deleting…" : "Delete"}
        </button>
      </div>
      {deleteError && <p role="alert">{deleteError}</p>}
    </OverviewCard>
  );
}
