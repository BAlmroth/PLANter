import { useState } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { getConnections } from "../relationships/connections";
import { useRelationships } from "../relationships/useRelationships";
import { createItem } from "./itemsApi";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRowCard";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";

// The File view: a project's items grouped by category, read-only apart from adding items.
// Editing, deleting and connecting are done in the detail view of an item.
export function FileView({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  // true while the add form is open
  const [adding, setAdding] = useState(false);

  const loading = template.loading || items.loading || relationships.loading;
  const error = template.error ?? items.error ?? relationships.error;

  // Retry only the request that failed
  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
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

  const loadedTemplate = template.template;
  const connectionsOf = (itemId: string) =>
    getConnections(itemId, relationships.relationships, items.items, loadedTemplate);

  // Items whose type is not in the template (for example an old key) go under "Unknown"
  const knownKeys = loadedTemplate.itemTypes.map((type) => type.key);
  const unknownItems = items.items.filter((item) => !knownKeys.includes(item.type));

  return (
    <section>
      {adding ? (
        <ItemForm
          types={loadedTemplate.itemTypes}
          submitLabel="Add item"
          onCancel={() => setAdding(false)}
          onSubmit={async ({ title, description, type }) => {
            try {
              const item = await createItem(project.id, {
                title,
                type,
                ...(description !== "" && { description }),
              });
              // Show the new item without asking the server for the whole list again
              items.setItems((current) => [...current, item]);
              setAdding(false);
              return null;
            } catch (err) {
              return err instanceof ApiError ? err.message : "Something went wrong.";
            }
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)}>
          Add Item
        </button>
      )}

      {loadedTemplate.itemTypes.map((type) => {
        const typeItems = items.items.filter((item) => item.type === type.key);
        return (
          <section key={type.key}>
            <h2>{type.pluralLabel}</h2>
            {typeItems.length === 0 ? (
              <p>No items yet.</p>
            ) : (
              <ul>
                {typeItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    projectId={project.id}
                    item={item}
                    connections={connectionsOf(item.id)}
                  />
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
              <ItemRow
                key={item.id}
                projectId={project.id}
                item={item}
                connections={connectionsOf(item.id)}
              />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}
