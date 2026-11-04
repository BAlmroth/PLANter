import type { Group } from "./types";

// The groups an item is in, in the order of the groups list
export function getGroupsOfItem(itemId: string, groups: Group[]) {
  return groups.filter((group) => group.itemIds.includes(itemId));
}
