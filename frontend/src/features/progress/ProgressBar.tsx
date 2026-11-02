import type { ProgressCount } from "./types";

type Props = {
  progress: ProgressCount;
  label: string; // used for screen readers, for example "Project progress"
};

// A bar for done / total, with the numbers as text. In-progress items are listed,
// but they are not part of the bar.
export function ProgressBar({ progress, label }: Props) {
  return (
    <div>
      <progress max={100} value={progress.percent} aria-label={label} />{" "}
      <span>
        {progress.done} of {progress.total} done ({progress.percent}%)
      </span>
      {progress.inProgress > 0 && <span> · {progress.inProgress} in progress</span>}
    </div>
  );
}
