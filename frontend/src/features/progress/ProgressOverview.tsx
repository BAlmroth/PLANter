import { useTemplate } from "../items/useTemplate";
import { ProgressBar } from "./ProgressBar";
import type { Progress } from "./types";

type Props = {
  progress: Progress;
  templateKey: string;
};

// The Progress tab: total and per category. The numbers come from the backend,
// the template is only used for the category labels.
export function ProgressOverview({ progress, templateKey }: Props) {
  const templateState = useTemplate(templateKey);

  if (templateState.loading) {
    return <p>Loading categories…</p>;
  }

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

  // Category key -> label, from the template. Unknown keys show as "Unknown" instead of crashing.
  const labelFor = (key: string) =>
    templateState.template!.itemTypes.find((t) => t.key === key)?.pluralLabel ?? "Unknown";

  return (
    <section>
      <h2>Progress</h2>
      <ProgressBar progress={progress} label="Total progress" />

      <h3>By category</h3>
      {progress.categories.length === 0 && <p>No categories to show.</p>}
      <ul>
        {progress.categories.map((category) => (
          <li key={category.key}>
            <strong>{labelFor(category.key)}</strong>
            <ProgressBar progress={category} label={`${labelFor(category.key)} progress`} />
          </li>
        ))}
      </ul>
    </section>
  );
}
