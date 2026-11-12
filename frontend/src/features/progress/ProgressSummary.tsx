import { useTemplate } from "../items/useTemplate";
import { ProgressBar } from "./ProgressBar";
import { ProgressRing } from "./ProgressRing";
import type { Progress } from "./types";
import styles from "./ProgressSummary.module.css";

type Props = {
  progress: Progress;
  templateKey: string;
};

// The total as a ring, and one slim bar per category under it. The numbers come from the backend,
// the template is only used for the category labels and colors.
export function ProgressSummary({ progress, templateKey }: Props) {
  const templateState = useTemplate(templateKey);

  if (templateState.loading) return <p>Loading categories…</p>;

  if (templateState.error) {
    return (
      <div role="alert">
        <p>{templateState.error}</p>
        <button type="button" onClick={templateState.refetch}>
          Try again
        </button>
      </div>
    );
  }

  if (!templateState.template) return null;

  // Category key -> label and color, from the template. Unknown keys show as "Unknown" instead of crashing,
  // and get the browser's default bar color.
  const loadedTemplate = templateState.template;
  const labelFor = (key: string) => loadedTemplate.itemTypes.find((t) => t.key === key)?.pluralLabel ?? "Unknown";
  const colorFor = (key: string) => loadedTemplate.itemTypes.find((t) => t.key === key)?.color;

  // Only categories that have items: an empty category would be a row of "0/0". The categories
  // people forget are listed under "Yet to plan" instead.
  const categories = progress.categories.filter((category) => category.total > 0);

  return (
    <section className={styles.summary} aria-labelledby="progress-title">
      <h3 id="progress-title" className={styles.title}>
        Progress
      </h3>
      <ProgressRing progress={progress} />

      {categories.length > 0 && (
        <ul className={styles.list}>
          {categories.map((category) => (
            <li key={category.key} className={styles.row}>
              <span className={styles.name}>{labelFor(category.key)}</span>
              <ProgressBar
                progress={category}
                label={`${labelFor(category.key)} progress`}
                color={colorFor(category.key)}
                compact
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
