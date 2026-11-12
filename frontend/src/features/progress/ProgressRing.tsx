import { ringOffset } from "./ringOffset";
import type { ProgressCount } from "./types";
import styles from "./ProgressRing.module.css";

// The size of the drawing in SVG units. The CSS decides how big it is on screen.
const SIZE = 120;
const STROKE = 12;
// The circle runs through the middle of the stroke, so half the stroke is taken off the radius
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type Props = { progress: ProgressCount };

// The total progress as a ring with the percent in the middle and the numbers under it.
// One neutral color on purpose: item type colors are for categories (the bars next to it), not for "done".
export function ProgressRing({ progress }: Props) {
  return (
    <div className={styles.ring}>
      <div className={styles.circle}>
        {/* aria-hidden: the drawing is decoration, the same numbers are written out as text */}
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true">
          <circle className={styles.track} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
          {/* Not drawn at 0%: the round line ends would still show a dot at the top */}
          {progress.percent > 0 && (
            <circle
              className={styles.fill}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              strokeWidth={STROKE}
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={ringOffset(progress.percent, CIRCUMFERENCE)}
            />
          )}
        </svg>
        <span className={styles.percent}>{progress.percent}%</span>
      </div>
      <p className={styles.caption}>
        {progress.done} of {progress.total} done
        {progress.inProgress > 0 && <> · {progress.inProgress} in progress</>}
      </p>
    </div>
  );
}
