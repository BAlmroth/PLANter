import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

export function Footer() {
  return (
    <footer className={styles.footer}>
      <span>PLANter</span>
      <Link to="/help" className={styles.link}>
        Help
      </Link>
    </footer>
  );
}
