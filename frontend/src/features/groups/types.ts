// The shape of what the group routes return. itemIds are the items in the group.
export type Group = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  color: string; // "#RRGGBB", one of the template's groupColors
  createdAt: string;
  itemIds: string[];
};

// description: "" clears it on update, and is left out on create when empty.
// color: left out on create = the backend picks the next unused one.
export type GroupInput = {
  name: string;
  description?: string;
  color?: string;
};
