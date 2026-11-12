import type { ProgressCount } from "./types";
import styles from "./ProgressBar.module.css";

type Props = {
  progress: ProgressCount;
  label: string; // used for screen readers, for example "Project progress"
  color?: string; // "#RRGGBB" from the template, for example the item type's color. Default: the browser's.
  // A short bar with only "3/5", for places with little room (the category headings in the item list)
  compact?: boolean;
};

// A bar for done / total, with the numbers as text. In-progress items are listed,
// but they are not part of the bar.
export function ProgressBar({ progress, label, color, compact = false }: Props) {
  // accent-color colors the filled part of a native <progress>
  const bar = <progress max={100} value={progress.percent} aria-label={label} style={{ accentColor: color }} />;

  if (compact) {
    return (
      // title: the full numbers on hover, since the short text leaves out the percent and in progress
      <span className={styles.compact} title={`${progress.done} of ${progress.total} done (${progress.percent}%)`}>
        {bar}
        <span>
          {progress.done}/{progress.total} done
        </span>
      </span>
    );
  }

  return (
    <div>
      {bar}{" "}
      <span>
        {progress.done} of {progress.total} done ({progress.percent}%)
      </span>
      {progress.inProgress > 0 && <span> · {progress.inProgress} in progress</span>}
    </div>
  );
}
