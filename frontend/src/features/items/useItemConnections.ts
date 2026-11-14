import type { Dispatch, SetStateAction } from "react";
import type { ConnectOption } from "../relationships/connections";
import { createRelationship } from "../relationships/relationshipsApi";
import type { Relationship } from "../relationships/types";
import { createItem, deleteItem } from "./itemsApi";
import { messageFrom } from "./messageFrom";
import type { Item } from "./types";

type Options = {
  projectId: string;
  // The item whose page is open
  itemId: string;
  setItems: Dispatch<SetStateAction<Item[]>>;
  setRelationships: (next: Relationship[] | ((current: Relationship[]) => Relationship[])) => void;
  refreshWarnings: () => void;
  refreshProgress: () => void;
};

// The two ways to add a connection from the item page. Both return an error message, or null when it worked.
// They hold no state of their own: they send the requests and update the lists that the page owns.
export function useItemConnections({
  projectId,
  itemId,
  setItems,
  setRelationships,
  refreshWarnings,
  refreshProgress,
}: Options) {
  // Creates a new item and connects it to this one. Two requests: if the connection is refused
  // (for example it would make a loop), the new item is deleted again so nothing is left behind.
  async function addConnectedItem(option: ConnectOption, title: string) {
    let newItem: Item;
    try {
      newItem = await createItem(projectId, { title, type: option.newItemType });
    } catch (err) {
      return messageFrom(err);
    }

    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? newItem.id : itemId,
        targetItemId: option.newItemIsSource ? itemId : newItem.id,
        type: option.relationshipType,
      });
      setItems((current) => [...current, newItem]);
      setRelationships((current) => [...current, relationship]);
      refreshWarnings();
      refreshProgress(); // the new item counts as planned
      return null;
    } catch (err) {
      // Undo: remove the item we just created
      const undone = await deleteItem(newItem.id).then(
        () => true,
        () => false,
      );
      return undone
        ? messageFrom(err)
        : `${messageFrom(err)} The new item was created but not connected. Reload to see it.`;
    }
  }

  // Connects this item to an item that already exists.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  async function connectExisting(option: ConnectOption, otherItemId: string) {
    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? otherItemId : itemId,
        targetItemId: option.newItemIsSource ? itemId : otherItemId,
        type: option.relationshipType,
      });
      setRelationships((current) => [...current, relationship]);
      refreshWarnings();
      return null;
    } catch (err) {
      return messageFrom(err);
    }
  }

  return { addConnectedItem, connectExisting };
}
