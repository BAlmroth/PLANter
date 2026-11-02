import { Link } from "react-router-dom";
import { useAuth } from "../auth/authContext";
import { LogoutButton } from "../auth/LogoutButton";
import styles from "./Header.module.css";

export function Header() {
  const { user } = useAuth();

  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>
        <span className={styles.mark}>P</span>
        PLANter
      </Link>
      <div className={styles.user}>
        <span>{user?.email}</span>
        <LogoutButton />
      </div>
    </header>
  );
}