import type { Node } from "@xyflow/react";
import type { ItemStatus } from "../items/types";
import type { CardSize } from "./cardSize";

// What one item node carries. React Flow requires `data` to be a plain object type.
export type ItemNodeData = {
  title: string;
  category: string; // template key, for example "page"
  categoryLabel: string; // the label from the template, or "Unknown"
  color: string | undefined; // the type's color from the template, undefined for an unknown type
  status: ItemStatus;
  groups: { id: string; name: string; color: string }[]; // the groups the item is in, shown as dots
  warnings: string[]; // what might be missing, shown behind a "!" badge. Empty = no badge.
  size: CardSize; // from the template: pages are large, assets and tests small
  vertical: boolean; // true: the map flows top to bottom, so the connection dots are on the top and bottom
};

// `Node<Data, "item">`: a node whose `type` is "item" and whose `data` has the shape above.
export type ItemNodeType = Node<ItemNodeData, "item">;
