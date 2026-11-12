import { useState } from "react";
import { ApiError } from "../../lib/api";
import { OverviewCard } from "./OverviewCard";
import { ProjectForm } from "./ProjectForm";
import { updateProject } from "./projectsApi";
import type { Project } from "./types";
import styles from "./ProjectOverview.module.css";

type Props = { project: Project; setProject: (project: Project) => void };

// The project's name and description, with edit (the Description page)
export function ProjectDescriptionCard({ project, setProject }: Props) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <OverviewCard label="Project description">
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
    <OverviewCard label="Project description">
      <h3 className={styles.cardTitle}>{project.name}</h3>
      {/* "" and null both mean no description */}
      <p>{project.description || "No description"}</p>
      <small>Created {new Date(project.createdAt).toLocaleString()}</small>
      <div className={styles.actions}>
        <button type="button" onClick={() => setEditing(true)}>
          Edit
        </button>
      </div>
    </OverviewCard>
  );
}
