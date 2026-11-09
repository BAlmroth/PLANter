import type { Node } from "@xyflow/react";
import type { ItemStatus } from "../items/types";

// What one item node carries. React Flow requires `data` to be a plain object type.
export type ItemNodeData = {
  title: string;
  category: string; // template key, for example "page"
  categoryLabel: string; // the label from the template, or "Unknown"
  color: string | undefined; // the type's color from the template, undefined for an unknown type
  status: ItemStatus;
  warnings: string[]; // what might be missing, shown behind a "!" badge. Empty = no badge.
};

// `Node<Data, "item">`: a node whose `type` is "item" and whose `data` has the shape above.
export type ItemNodeType = Node<ItemNodeData, "item">;
