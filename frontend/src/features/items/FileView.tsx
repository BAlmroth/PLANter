import type { Project } from "../projects/types";
import { ItemRow } from "./ItemRowCard";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";

// The File view. a project's items grouped by category

export function FileView({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);

  const loading = template.loading || items.loading;
  const error = template.error ?? items.error;

  // Retry only the request that failed
  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
  }

  if (loading) return <p>Loading items…</p>;

  if (error || !template.template) {
    return (
      <div role="alert">
        <p>{error ?? "Something went wrong."}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  // Items whose type is not in the template (for example an old key) go under "Unknown"
  const knownKeys = template.template.itemTypes.map((type) => type.key);
  const unknownItems = items.items.filter((item) => !knownKeys.includes(item.type));

  return (
    <section>
      {template.template.itemTypes.map((type) => {
        const typeItems = items.items.filter((item) => item.type === type.key);
        return (
          <section key={type.key}>
            <h2>{type.pluralLabel}</h2>
            {typeItems.length === 0 ? (
              <p>No items yet.</p>
            ) : (
              <ul>
                {typeItems.map((item) => (
                  <ItemRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {unknownItems.length > 0 && (
        <section>
          <h2>Unknown</h2>
          <ul>
            {unknownItems.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}