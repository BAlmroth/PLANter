import { useState } from "react";
import { Panel } from "@xyflow/react";
import type { Group } from "../groups/types";
import { ItemFilterBar } from "../filters/ItemFilterBar";
import type { ItemFilters } from "../filters/itemFilters";
import { ItemForm, type ItemFormValues } from "../items/ItemForm";
import type { Template } from "../items/types";
import type { LayoutDirection } from "./tidyLayout";
import styles from "./MapView.module.css";

type Props = {
  template: Template;
  groups: Group[];
  itemCount: number;
  filters: ItemFilters;
  onFiltersChange: (filters: ItemFilters) => void;
  direction: LayoutDirection;
  // Tidies the map. A direction is only given when the user picks the other one.
  onTidy: (newDirection?: LayoutDirection) => void;
  // Creates the item. Returns an error message, or null when it worked.
  onAddItem: (values: ItemFormValues) => Promise<string | null>;
};

// The box in the top left corner of the map: Filter, "+ Add item" and Manage. Each opens a panel
// under the buttons, in the same box. Must be rendered inside <ReactFlow> (it is a Panel).
export function MapToolbar({ template, groups, itemCount, filters, onFiltersChange, direction, onTidy, onAddItem }: Props) {
  // true while the add item form is open
  const [adding, setAdding] = useState(false);
  // true while the "Manage" panel (Tidy up and the map direction) is open
  const [managing, setManaging] = useState(false);
  // true while the filter panel is open
  const [filtering, setFiltering] = useState(false);

  // How many filters are on, shown on the Filter button so you can see it with the panel closed
  const activeFilterCount =
    filters.types.length + filters.groupIds.length + filters.statuses.length + (filters.mvpOnly ? 1 : 0);

  return (
    // data-tour: what the tutorial points at (features/tour/tourSteps.ts)
    <Panel position="top-left" className={styles.box} data-tour="map-toolbar">
      <div className={styles.toolbar}>
        {/* The filters open in a panel under the toolbar. The button shows how many are on. */}
        <button
          type="button"
          className={styles.small}
          aria-expanded={filtering}
          onClick={() => setFiltering((open) => !open)}
        >
          Filter{activeFilterCount > 0 && ` (${activeFilterCount})`} {filtering ? "▴" : "▾"}
        </button>
        {!adding && (
          <button type="button" className={styles.small} onClick={() => setAdding(true)}>
            + Add item
          </button>
        )}
        {!adding && itemCount > 1 && (
          <button
            type="button"
            className={styles.small}
            aria-expanded={managing}
            onClick={() => setManaging((open) => !open)}
          >
            Manage {managing ? "▴" : "▾"}
          </button>
        )}
      </div>
      {filtering && (
        <div className={styles.manage}>
          <ItemFilterBar filters={filters} onChange={onFiltersChange} template={template} groups={groups} />
        </div>
      )}
      {managing && !adding && itemCount > 1 && (
        <div className={styles.manage}>
          <button
            type="button"
            className={styles.small}
            onClick={() => {
              setManaging(false);
              onTidy();
            }}
          >
            Tidy up
          </button>
          {/* Picking the other direction tidies the map in that direction (after a confirm) */}
          <span className={styles.direction} role="group" aria-label="Map direction">
            <button
              type="button"
              className={styles.small}
              aria-pressed={direction === "horizontal"}
              onClick={() => direction !== "horizontal" && onTidy("horizontal")}
            >
              Left → right
            </button>
            <button
              type="button"
              className={styles.small}
              aria-pressed={direction === "vertical"}
              onClick={() => direction !== "vertical" && onTidy("vertical")}
            >
              Top ↓ bottom
            </button>
          </span>
        </div>
      )}
      {adding && (
        <div className={styles.addForm}>
          <ItemForm
            types={template.itemTypes}
            submitLabel="Add item"
            onCancel={() => setAdding(false)}
            onSubmit={async (values) => {
              const message = await onAddItem(values);
              if (message === null) setAdding(false);
              return message;
            }}
          />
        </div>
      )}
    </Panel>
  );
}
