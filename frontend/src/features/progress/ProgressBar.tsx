import type { ProgressCount } from "./types";

type Props = {
  progress: ProgressCount;
  label: string; // used for screen readers, for example "Project progress"
  color?: string; // "#RRGGBB" from the template, for example the item type's color. Default: the browser's.
};

// A bar for done / total, with the numbers as text. In-progress items are listed,
// but they are not part of the bar.
export function ProgressBar({ progress, label, color }: Props) {
  return (
    <div>
      {/* accent-color colors the filled part of a native <progress> */}
      <progress max={100} value={progress.percent} aria-label={label} style={{ accentColor: color }} />{" "}
      <span>
        {progress.done} of {progress.total} done ({progress.percent}%)
      </span>
      {progress.inProgress > 0 && <span> · {progress.inProgress} in progress</span>}
    </div>
  );
}
