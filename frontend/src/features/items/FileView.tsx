import { useState } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { GroupSection } from "../groups/GroupSection";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { getConnections } from "../relationships/connections";
import { useRelationships } from "../relationships/useRelationships";
import { createItem } from "./itemsApi";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRowCard";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./FileView.module.css";

// The File view: a project's items grouped by category, read-only apart from adding items.
// Editing, deleting and connecting are done in the detail view of an item.
export function FileView({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const groups = useGroups(project.id);
  // true while the add form is open
  const [adding, setAdding] = useState(false);

  const loading = template.loading || items.loading || relationships.loading || groups.loading;
  const error = template.error ?? items.error ?? relationships.error ?? groups.error;

  // Retry only the request that failed
  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (groups.error) groups.refetch();
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
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Files</h1>
        <span className={styles.count}>{items.items.length} items</span>
        {!adding && (
          <button type="button" className={styles.addButton} onClick={() => setAdding(true)}>
            + Add item
          </button>
        )}
      </div>

      {/* ItemForm is shared with the map and the item page, so it is styled from here (.addForm) */}
      {adding && (
        <div className={`${styles.card} ${styles.addForm}`}>
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
        </div>
      )}

      <GroupSection projectId={project.id} groups={groups.groups} setGroups={groups.setGroups} items={items.items} />

      <div className={styles.grid}>
        {loadedTemplate.itemTypes.map((type) => {
          const typeItems = items.items.filter((item) => item.type === type.key);
          return (
            <section key={type.key} className={styles.card}>
              <h2 className={styles.label}>
                {type.pluralLabel} <span className={styles.labelCount}>{typeItems.length}</span>
              </h2>
              {typeItems.length === 0 ? (
                <p className={styles.empty}>No items yet.</p>
              ) : (
                <ul className={styles.list}>
                  {typeItems.map((item) => (
                    <ItemRow
                      key={item.id}
                      projectId={project.id}
                      item={item}
                      connections={connectionsOf(item.id)}
                      groups={getGroupsOfItem(item.id, groups.groups)}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}

        {unknownItems.length > 0 && (
          <section className={styles.card}>
            <h2 className={styles.label}>Unknown</h2>
            <ul className={styles.list}>
              {unknownItems.map((item) => (
                <ItemRow
                  key={item.id}
                  projectId={project.id}
                  item={item}
                  connections={connectionsOf(item.id)}
                      groups={getGroupsOfItem(item.id, groups.groups)}
                />
              ))}
            </ul>
          </section>
        )}
      </div>
    </section>
  );
}
