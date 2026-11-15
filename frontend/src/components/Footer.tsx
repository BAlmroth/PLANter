import { Link } from "react-router-dom";
import styles from "./Footer.module.css";

// Smooth scroll, unless the user has "reduce motion" turned on
function scrollToTop() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
}

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.brand}>
        <span className={styles.name}>
          {/* alt="" because the name next to it already says PLANter */}
          <img src="/logo.png" alt="" className={styles.logo} />
          PLANter
        </span>
        <small>© 2026 Benita Almroth</small>
      </div>

      {/* Links inside the app */}
      <nav className={styles.section} aria-labelledby="footer-app">
        <h2 id="footer-app" className={styles.heading}>
          PLANter
        </h2>
        <Link to="/" className={styles.link}>
          All projects
        </Link>
        <Link to="/help" className={styles.link}>
          Help
        </Link>
      </nav>

      {/* Links that leave the app */}
      <nav className={styles.section} aria-labelledby="footer-about">
        <h2 id="footer-about" className={styles.heading}>
          About
        </h2>
        <a href="mailto:benita.almroth@outlook.com" className={styles.link}>
          Contact
        </a>
        <a
          href="https://github.com/BAlmroth/PLANter"
          className={styles.link}
          target="_blank"
          rel="noreferrer"
        >
          GitHub
        </a>
      </nav>

      <button type="button" className={styles.toTop} onClick={scrollToTop}>
        ↑ Top
      </button>
    </footer>
  );
}
