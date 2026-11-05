import type { Group } from "../groups/types";
import { STATUS_LABELS, type ItemStatus, type Template } from "../items/types";
import { hasFilters, NO_FILTERS, type MapFilters } from "./mapFilters";

// The filters above the map. Items that match get a purple outline on the map.
export function MapFilterBar({
  filters,
  onChange,
  template,
  groups,
}: {
  filters: MapFilters;
  onChange: (filters: MapFilters) => void;
  template: Template;
  groups: Group[];
}) {
  return (
    <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", margin: "8px 0" }}>
      <label>
        Type{" "}
        <select value={filters.type} onChange={(e) => onChange({ ...filters, type: e.target.value })}>
          <option value="">All</option>
          {template.itemTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      </label>
      <label>
        Group{" "}
        <select value={filters.groupId} onChange={(e) => onChange({ ...filters, groupId: e.target.value })}>
          <option value="">All</option>
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status{" "}
        <select
          value={filters.status}
          onChange={(e) => onChange({ ...filters, status: e.target.value as ItemStatus | "" })}
        >
          <option value="">All</option>
          {(Object.keys(STATUS_LABELS) as ItemStatus[]).map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </label>
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
