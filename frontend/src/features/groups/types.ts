// The shape of what the group routes return. itemIds are the items in the group.
export type Group = {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  createdAt: string;
  itemIds: string[];
};

// description: "" clears it on update, and is left out on create when empty
export type GroupInput = {
  name: string;
  description?: string;
};
