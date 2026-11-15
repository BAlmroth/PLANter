import type { Group } from "./types";

// The groups an item is in, in the order of the groups list
export function getGroupsOfItem(itemId: string, groups: Group[]) {
  return groups.filter((group) => group.itemIds.includes(itemId));
}

// What has to change to go from the groups an item is in (before) to the chosen ones (after)
export function diffGroupIds(before: string[], after: string[]) {
  return {
    add: after.filter((id) => !before.includes(id)),
    remove: before.filter((id) => !after.includes(id)),
  };
}

// The groups list with the item in exactly the groups in groupIds, so the page can update without a refetch
export function withItemInGroups(groups: Group[], itemId: string, groupIds: string[]) {
  return groups.map((group) => {
    const isIn = group.itemIds.includes(itemId);
    const shouldBeIn = groupIds.includes(group.id);
    if (isIn === shouldBeIn) return group;
    const itemIds = shouldBeIn ? [...group.itemIds, itemId] : group.itemIds.filter((id) => id !== itemId);
    return { ...group, itemIds };
  });
}
