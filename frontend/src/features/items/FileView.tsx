import { useState } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { GroupSection } from "../groups/GroupSection";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { getConnections } from "../relationships/connections";
import { useRelationships } from "../relationships/useRelationships";
import type { WarningsByItem } from "../warnings/types";
import { createItem } from "./itemsApi";
import { getFileSections, type FileViewMode } from "./fileSections";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRowCard";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./FileView.module.css";

// The File view: a project's items grouped by category, read-only apart from adding items.
// Editing, deleting and connecting are done in the detail view of an item.
export function FileView({ project, warnings }: { project: Project; warnings: WarningsByItem }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const groups = useGroups(project.id);
  // true while the add form is open
  const [adding, setAdding] = useState(false);
  // How the items are divided into cards
  const [mode, setMode] = useState<FileViewMode>("category");

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

  // The cards: one per category or one per group, depending on the mode
  const sections = getFileSections(mode, items.items, loadedTemplate, groups.groups);

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Files</h1>
        <span className={styles.count}>{items.items.length} items</span>
        <div className={styles.modes} role="group" aria-label="Group items by">
          {(["category", "group"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={mode === option}
              className={mode === option ? styles.modeActive : styles.mode}
              onClick={() => setMode(option)}
            >
              {option === "category" ? "Category" : "Group"}
            </button>
          ))}
        </div>
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
        {sections.map((section) => (
          <section key={section.key} className={styles.card}>
            <h2 className={styles.label}>
              {section.title} <span className={styles.labelCount}>{section.items.length}</span>
            </h2>
            {section.description && <p className={styles.description}>{section.description}</p>}
            {section.items.length === 0 ? (
              <p className={styles.empty}>No items yet.</p>
            ) : (
              <ul className={styles.list}>
                {section.items.map((item) => (
                  <ItemRow
                    key={item.id}
                    projectId={project.id}
                    item={item}
                    connections={connectionsOf(item.id)}
                    groups={getGroupsOfItem(item.id, groups.groups)}
                    warnings={warnings.get(item.id) ?? []}
                  />
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
