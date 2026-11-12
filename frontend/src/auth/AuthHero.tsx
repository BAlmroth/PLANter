import styles from "./AuthHero.module.css";

// Decorative left side of the login/register page: a tiny sketch of the
// relationship map. It is not real data, so it is hidden from screen readers.
export function AuthHero() {
  return (
    <section className={styles.hero}>
      <p className={styles.brand}>PLANter</p>
      <h2 className={styles.headline}>Plan it before you build it.</h2>
      <p className={styles.lead}>
        A visual plan for your website or app: break it into pages, components
        and data, and connect the pieces.
      </p>

      <svg
        className={styles.sketch}
        viewBox="0 0 360 180"
        aria-hidden="true"
        focusable="false"
      >
        <g className={styles.line}>
          <path d="M70 50 L170 50" />
          <path d="M70 50 L110 130" />
          <path d="M170 50 L270 50" />
          <path d="M110 130 L230 130" />
          <path d="M270 50 L230 130" />
        </g>
        <circle className={styles.nodeA} cx="70" cy="50" r="16" />
        <circle className={styles.nodeB} cx="170" cy="50" r="16" />
        <circle className={styles.nodeC} cx="270" cy="50" r="16" />
        <circle className={styles.nodeD} cx="110" cy="130" r="16" />
        <circle className={styles.nodeE} cx="230" cy="130" r="16" />
      </svg>

      <ul className={styles.points}>
        <li>
          <span className={styles.dotPrimary} /> See your plan as a list and as
          a map
        </li>
        <li>
          <span className={styles.dotAccent} /> Mark what belongs in the MVP
        </li>
        <li>
          <span className={styles.dotDanger} /> Get warned about what you forgot
        </li>
      </ul>
    </section>
  );
}
