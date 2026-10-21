import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../lib/api";
import { createProject } from "../features/projects/projectsApi";
import { ProjectForm } from "../features/projects/ProjectForm";

// There is only one template for now (the game template is a Could) so there is no dropdown.
// When a second template exists: add GET /api/templates (a list) and a select

const DEFAULT_TEMPLATE = "web";

export function NewProjectPage() {
  const navigate = useNavigate();

  return (
    <main>
      <h1>New project</h1>
      <ProjectForm
        submitLabel="Create project"
        onSubmit={async ({ name, description }) => {
          try {
            const project = await createProject({
              name,
              template: DEFAULT_TEMPLATE,
              ...(description !== "" && { description }),
            });
            navigate(`/projects/${project.id}`);
            return null;
          } catch (err) {
            return err instanceof ApiError ? err.message : "Something went wrong.";
          }
        }}
      />
      <p>
        <Link to="/">Back to projects</Link>
      </p>
    </main>
  );
}
