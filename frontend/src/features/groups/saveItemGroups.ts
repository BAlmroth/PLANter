import { addItemToGroup, removeItemFromGroup } from "./groupsApi";
import { diffGroupIds } from "./itemGroups";

// Puts an item in exactly the chosen groups, with one request per changed group.
// Returns the groups the item really is in afterwards (a failed request leaves that group as it was),
// and whether any request failed, so the caller can update its list and show an error.
export async function saveItemGroups(itemId: string, before: string[], after: string[]) {
  const { add, remove } = diffGroupIds(before, after);
  let groupIds = [...before];
  let failed = false;

  for (const groupId of add) {
    try {
      await addItemToGroup(groupId, itemId);
      groupIds = [...groupIds, groupId];
    } catch {
      failed = true;
    }
  }
  for (const groupId of remove) {
    try {
      await removeItemFromGroup(groupId, itemId);
      groupIds = groupIds.filter((id) => id !== groupId);
    } catch {
      failed = true;
    }
  }

  return { groupIds, failed };
}
