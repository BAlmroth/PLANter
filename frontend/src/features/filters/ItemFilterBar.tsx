import type { Group } from "../groups/types";
import { STATUS_LABELS, type ItemStatus, type Template } from "../items/types";
import { hasFilters, NO_FILTERS, toggleValue, type ItemFilters } from "./itemFilters";
import styles from "./ItemFilterBar.module.css";

type Option = { value: string; label: string };

// One filter: a pill that opens a list with a checkbox per option. The pill shows how many are checked.
function CheckboxFilter({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Option[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    // <details> elements with the same name work together: opening one closes the others (built into HTML)
    <details name="item-filters" className={styles.filter}>
      <summary className={selected.length > 0 ? `${styles.pill} ${styles.pillActive}` : styles.pill}>
        {title}
        {selected.length > 0 && ` (${selected.length})`}
      </summary>
      <div className={styles.menu}>
        {options.length === 0 && <p className={styles.none}>None yet.</p>}
        {options.map((option) => (
          <label key={option.value} className={styles.option}>
            <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />
            {option.label}
          </label>
        ))}
      </div>
    </details>
  );
}

// The filters above the list and on top of the map. What a filter does to the items is up to the view.
export function ItemFilterBar({
  filters,
  onChange,
  template,
  groups,
}: {
  filters: ItemFilters;
  onChange: (filters: ItemFilters) => void;
  template: Template;
  groups: Group[];
}) {
  return (
    <div className={styles.bar}>
      <CheckboxFilter
        title="Type"
        options={template.itemTypes.map((type) => ({ value: type.key, label: type.label }))}
        selected={filters.types}
        onToggle={(value) => onChange({ ...filters, types: toggleValue(filters.types, value) })}
      />
      <CheckboxFilter
        title="Group"
        options={groups.map((group) => ({ value: group.id, label: group.name }))}
        selected={filters.groupIds}
        onToggle={(value) => onChange({ ...filters, groupIds: toggleValue(filters.groupIds, value) })}
      />
      <CheckboxFilter
        title="Status"
        options={(Object.keys(STATUS_LABELS) as ItemStatus[]).map((status) => ({
          value: status,
          label: STATUS_LABELS[status],
        }))}
        selected={filters.statuses}
        onToggle={(value) =>
          onChange({ ...filters, statuses: toggleValue(filters.statuses, value as ItemStatus) })
        }
      />
      {/* Not a list, so a pill with a checkbox inside instead of a menu */}
      <label className={filters.mvpOnly ? `${styles.pill} ${styles.pillActive}` : styles.pill}>
        <input
          type="checkbox"
          checked={filters.mvpOnly}
          onChange={(e) => onChange({ ...filters, mvpOnly: e.target.checked })}
        />
        MVP only
      </label>
      {hasFilters(filters) && (
        <button type="button" className={styles.clear} onClick={() => onChange(NO_FILTERS)}>
          Clear filters
        </button>
      )}
    </div>
  );
}
