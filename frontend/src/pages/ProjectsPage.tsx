import { Link } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { ProjectCard } from "../features/projects/ProjectCard";
import { useProjects } from "../features/projects/useProjects";

// The list of the logged-in user's projects
export function ProjectsPage() {
  const { projects, loading, error, refetch } = useProjects();

  return (
    <main>
      <h1>Projects</h1>
      <LogoutButton />
      <p>
        <Link to="/projects/new">New project</Link>
      </p>

      {loading && <p>Loading projects…</p>}

      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={refetch}>
            Try again
          </button>
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <p>You have no projects yet. Create your first one!</p>
      )}

      {!loading && !error && projects.length > 0 && (
        <ul>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      )}
    </main>
  );
}
