import type { Group } from "../groups/types";
import { STATUS_LABELS, type ItemStatus, type Template } from "../items/types";
import { hasFilters, NO_FILTERS, toggleValue, type ItemFilters } from "./itemFilters";

type Option = { value: string; label: string };

// One filter: a dropdown with a checkbox per option. The summary shows how many are checked.
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
    <details>
      <summary>
        {title}
        {selected.length > 0 && ` (${selected.length})`}
      </summary>
      {options.length === 0 && <p>None yet.</p>}
      {options.map((option) => (
        <label key={option.value} style={{ display: "block" }}>
          <input type="checkbox" checked={selected.includes(option.value)} onChange={() => onToggle(option.value)} />{" "}
          {option.label}
        </label>
      ))}
    </details>
  );
}

// The filters above the map and the File view. What a filter does to the items is up to the view.
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
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "flex-start", margin: "8px 0" }}>
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
      <label>
        <input
          type="checkbox"
          checked={filters.mvpOnly}
          onChange={(e) => onChange({ ...filters, mvpOnly: e.target.checked })}
        />{" "}
        MVP only
      </label>
      {hasFilters(filters) && (
        <button type="button" onClick={() => onChange(NO_FILTERS)}>
          Clear filters
        </button>
      )}
    </div>
  );
}
