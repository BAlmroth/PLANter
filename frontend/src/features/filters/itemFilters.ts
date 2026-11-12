import type { Group } from "../groups/types";
import type { Item, ItemStatus } from "../items/types";

// An empty list means "no filter on this". Several values in one list are OR (a page or a component),
// the different filters together are AND.
export type ItemFilters = {
  types: string[]; // template item type keys
  groupIds: string[];
  statuses: ItemStatus[];
  mvpOnly: boolean;
};

export const NO_FILTERS: ItemFilters = { types: [], groupIds: [], statuses: [], mvpOnly: false };

export function hasFilters(filters: ItemFilters) {
  return (
    filters.types.length > 0 || filters.groupIds.length > 0 || filters.statuses.length > 0 || filters.mvpOnly
  );
}

// Adds the value to the list, or removes it if it is already in it
export function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

// true when the item passes every active filter
export function matchesFilters(item: Item, filters: ItemFilters, groups: Group[]) {
  if (filters.types.length > 0 && !filters.types.includes(item.type)) return false;
  if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) return false;
  if (filters.mvpOnly && !item.isMvp) return false;
  if (filters.groupIds.length > 0) {
    const inSelectedGroup = groups.some((group) => filters.groupIds.includes(group.id) && group.itemIds.includes(item.id));
    if (!inSelectedGroup) return false;
  }
  return true;
}
