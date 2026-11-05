import type { Group } from "../groups/types";
import type { Item, ItemStatus } from "../items/types";

// "" means "no filter on this"
export type MapFilters = {
  type: string; // template item type key
  groupId: string;
  status: ItemStatus | "";
  mvpOnly: boolean;
};

export const NO_FILTERS: MapFilters = { type: "", groupId: "", status: "", mvpOnly: false };

export function hasFilters(filters: MapFilters) {
  return filters.type !== "" || filters.groupId !== "" || filters.status !== "" || filters.mvpOnly;
}

// true when the item passes every active filter
export function matchesFilters(item: Item, filters: MapFilters, groups: Group[]) {
  if (filters.type && item.type !== filters.type) return false;
  if (filters.status && item.status !== filters.status) return false;
  if (filters.mvpOnly && !item.isMvp) return false;
  if (filters.groupId) {
    const group = groups.find((g) => g.id === filters.groupId);
    if (!group?.itemIds.includes(item.id)) return false;
  }
  return true;
}
