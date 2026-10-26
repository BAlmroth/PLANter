import { Link } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { ProjectCard } from "../features/projects/ProjectCard";
import { useProjects } from "../features/projects/useProjects";
import styles from "./ProjectsPage.module.css";

// The list of the logged-in user's projects
export function ProjectsPage() {
  const { projects, loading, error, refetch } = useProjects();

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome, [name]</h1>
          <p className={styles.subtitle}>Projects overview</p>
        </div>
        {/* The nav comes later, until then the logout button lives here */}
        <div className={styles.actions}>
          <LogoutButton />
          <Link to="/projects/new" className={styles.newButton}>
            + New project
          </Link>
        </div>
      </header>

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
        <ul className={styles.list}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </ul>
      )}
    </main>
  );
}