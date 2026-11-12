import { useState } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { GroupSection } from "../groups/GroupSection";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { ItemFilterBar } from "../filters/ItemFilterBar";
import { hasFilters, matchesFilters, NO_FILTERS, type ItemFilters } from "../filters/itemFilters";
import { getConnections } from "../relationships/connections";
import { useRelationships } from "../relationships/useRelationships";
import { ProgressBar } from "../progress/ProgressBar";
import type { Progress } from "../progress/types";
import type { WarningsByItem } from "../warnings/types";
import { createItem } from "./itemsApi";
import { getFileSections, type FileSection, type FileViewMode } from "./fileSections";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRowCard";
import { typeColorVar } from "./typeColor";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./FileView.module.css";

// The File view: a project's items grouped by category, read-only apart from adding items.
// Editing, deleting and connecting are done in the detail view of an item.
type Props = {
  project: Project;
  warnings: WarningsByItem;
  progress: Progress | null; // null while loading: the headings are then shown without bars
  onItemAdded: () => void; // for example to load the progress again, since a new item changes the totals
};

export function FileView({ project, warnings, progress, onItemAdded }: Props) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const groups = useGroups(project.id);
  // true while the add form is open
  const [adding, setAdding] = useState(false);
  // true while the group panel is open. Closed by default, so the page starts with the items.
  const [managingGroups, setManagingGroups] = useState(false);
  // How the items are divided into cards
  const [mode, setMode] = useState<FileViewMode>("category");
  // Items that do not match are left out of the cards
  const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS);

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
  const filtering = hasFilters(filters);
  const shownItems = items.items.filter((item) => matchesFilters(item, filters, groups.groups));
  const allSections = getFileSections(mode, shownItems, loadedTemplate, groups.groups);
  const sections = allSections.filter((section) => section.items.length > 0);
  // Empty sections are collapsed into one line at the bottom instead of a heading each.
  // While filtering they are left out: there "empty" only means "filtered out".
  const emptySections = filtering ? [] : allSections.filter((section) => section.items.length === 0);

  // The slim progress bar in a category heading. Only in "Category" mode: groups are not progress categories.
  // The numbers come from the backend, so types that do not count toward progress have no entry and get no bar.
  // They ignore the filters on purpose: a filter hides items, it does not make them done.
  function categoryBar(section: FileSection) {
    if (mode !== "category") return null;
    const category = progress?.categories.find((c) => c.key === section.key);
    if (!category) return null;
    return (
      <ProgressBar
        progress={category}
        label={`${section.title} progress`}
        color={section.color ?? undefined}
        compact
      />
    );
  }

  return (
    <section className={styles.page}>
      {/* One toolbar row: title and count, how the cards are divided, the filters, and the two actions on the right.
          It wraps onto more rows on a narrow screen. */}
      <div className={styles.toolbar}>
        <span className={styles.count}>
          {filtering ? `${shownItems.length} of ${items.items.length}` : items.items.length} items
        </span>
        {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
        <div className={styles.modes} role="group" aria-label="Group items by" data-tour="file-modes">
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
        <ItemFilterBar filters={filters} onChange={setFilters} template={loadedTemplate} groups={groups.groups} />
        <div className={styles.actions}>
          {/* aria-expanded tells screen readers whether the panel this button controls is open */}
          <button
            type="button"
            className={styles.secondary}
            aria-expanded={managingGroups}
            aria-controls="group-panel"
            onClick={() => setManagingGroups((open) => !open)}
          >
            {managingGroups ? "Close groups" : "Manage groups"}
          </button>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} data-tour="add-item">
              + Add item
            </button>
          )}
        </div>
      </div>

      {managingGroups && (
        <div id="group-panel">
          <GroupSection
            projectId={project.id}
            groups={groups.groups}
            setGroups={groups.setGroups}
            items={items.items}
            groupColors={loadedTemplate.groupColors}
          />
        </div>
      )}

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
                onItemAdded();
                return null;
              } catch (err) {
                return err instanceof ApiError ? err.message : "Something went wrong.";
              }
            }}
          />
        </div>
      )}

      {filtering && sections.length === 0 && <p className={styles.empty}>No items match the filters.</p>}
      {items.items.length === 0 && <p className={styles.empty}>No items yet. Use “+ Add item” to create the first one.</p>}

      {/* One full-width section per category (or group), stacked. The items of a section fill a grid,
          so a big section gets more rows instead of one long column. */}
      <div className={styles.sections} data-tour="file-sections">
        {sections.map((section) => (
          // The heading line is in the section's color: the item type's in "Category" mode, the group's in "Group" mode.
          // --type-color is reused for both: CSS only needs "the color of this section".
          <section key={section.key} style={typeColorVar(section.color ?? undefined)}>
            <div className={styles.labelRow}>
              <h2 className={styles.label}>
                {section.title} <span className={styles.labelCount}>{section.items.length}</span>
              </h2>
              {categoryBar(section)}
            </div>
            {section.description && <p className={styles.description}>{section.description}</p>}
            <ul className={styles.list}>
              {section.items.map((item) => (
                <ItemRow
                  key={item.id}
                  projectId={project.id}
                  item={item}
                  template={loadedTemplate}
                  connections={connectionsOf(item.id)}
                  groups={getGroupsOfItem(item.id, groups.groups)}
                  warnings={warnings.get(item.id) ?? []}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* "No items yet: ● Testing ● Assets". Not shown when the whole project is empty (the message above says it). */}
      {items.items.length > 0 && emptySections.length > 0 && (
        <p className={styles.emptySections}>
          No items yet:
          {emptySections.map((section) => (
            // The dot is in the section's color, with the name next to it so the color never stands alone
            // title: hover shows what the category is, so an empty one still explains itself
            <span
              key={section.key}
              className={styles.emptyName}
              style={typeColorVar(section.color ?? undefined)}
              title={section.description ?? undefined}
            >
              {section.title}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
