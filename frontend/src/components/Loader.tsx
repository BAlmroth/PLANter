import styles from "./Loader.module.css";

type Props = {
  label?: string; // shown under the nodes and read by screen readers
  size?: "page" | "section" | "inline";
  instant?: boolean; // show at once, with no fade-in delay
};

// Three nodes that connect one after another, then start over. Pure CSS.
// It fades in after a short delay, so a very fast load shows nothing instead of a flash.
export function Loader({
  label = "Loading…",
  size = "section",
  instant,
}: Props) {
  return (
    <div
      className={`${styles.loader} ${styles[size]} ${instant ? styles.instant : ""}`}
      role="status"
      aria-live="polite"
    >
      {/* Three nodes that connect one after another, like the relationship map */}
      <svg className={styles.art} viewBox="0 0 96 48" aria-hidden="true">
        <path
          className={`${styles.edge} ${styles.edge1}`}
          d="M18 34 L48 14"
          pathLength="1"
        />
        <path
          className={`${styles.edge} ${styles.edge2}`}
          d="M48 14 L78 34"
          pathLength="1"
        />
        <g className={`${styles.node} ${styles.nodeA}`}>
          <rect
            className={styles.shadow}
            x="12"
            y="30"
            width="14"
            height="14"
            rx="3"
          />
          <rect
            className={styles.box}
            x="10"
            y="28"
            width="14"
            height="14"
            rx="3"
          />
        </g>
        <g className={`${styles.node} ${styles.nodeB}`}>
          <rect
            className={styles.shadow}
            x="42"
            y="8"
            width="14"
            height="14"
            rx="3"
          />
          <rect
            className={styles.box}
            x="40"
            y="6"
            width="14"
            height="14"
            rx="3"
          />
        </g>
        <g className={`${styles.node} ${styles.nodeC}`}>
          <rect
            className={styles.shadow}
            x="72"
            y="30"
            width="14"
            height="14"
            rx="3"
          />
          <rect
            className={styles.box}
            x="70"
            y="28"
            width="14"
            height="14"
            rx="3"
          />
        </g>
      </svg>
      <span className={styles.label}>{label}</span>
    </div>
  );
}
