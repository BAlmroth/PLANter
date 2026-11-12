import { STATUS_LABELS, type ItemStatus } from "./types";
import styles from "./StatusIcon.module.css";

type Props = {
  status: ItemStatus;
  // true: icon and text ("◐ In progress"). false: icon only, the text is the tooltip and the screen reader label.
  showLabel?: boolean;
};

// The status as a shape, not a color, so it never competes with the item type colors
// and is readable without seeing colors: empty circle = planned, half = in progress, full with a check = done.
// The SVG uses currentColor, so it takes the text color of where it is placed.
export function StatusIcon({ status, showLabel = false }: Props) {
  const label = STATUS_LABELS[status];

  const icon = (
    // viewBox 0 0 16 16: a circle with radius 6 in the middle
    <svg className={styles.icon} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6" fill={status === "done" ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.5" />
      {/* Left half: from the top (8,2) along the arc to the bottom (8,14), then back up */}
      {status === "in_progress" && <path d="M8 2 A6 6 0 0 0 8 14 Z" fill="currentColor" />}
      {/* A white check mark inside the filled circle */}
      {status === "done" && (
        <path d="M5 8.2 L7.2 10.3 L11 6" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  );

  if (showLabel) {
    return (
      <span className={styles.status}>
        {icon}
        {label}
      </span>
    );
  }
  // Icon only: role="img" + aria-label so screen readers still read the status, title for a hover tooltip
  return (
    <span className={styles.status} role="img" aria-label={label} title={label}>
      {icon}
    </span>
  );
}
