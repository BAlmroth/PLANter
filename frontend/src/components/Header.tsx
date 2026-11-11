import { Link, useMatch } from "react-router-dom";
import { LogoutButton } from "../auth/LogoutButton";
import { ProjectNav } from "../features/projects/ProjectNav";
import styles from "./Header.module.css";

export function Header() {
  // The header sits outside the project route, so useParams cannot be used here. useMatch can.
  // "new" is the create page, not a project.
  const match = useMatch("/projects/:projectId/*");
  const projectId = match?.params.projectId && match.params.projectId !== "new" ? match.params.projectId : null;

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.mark}>P</span>
        PLANter
      </Link>
      {projectId && <ProjectNav projectId={projectId} />}
      <div className={styles.user}>
        <LogoutButton />
      </div>
    </header>
  );
}
