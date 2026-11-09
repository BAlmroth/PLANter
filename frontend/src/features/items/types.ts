export type ItemStatus = "planned" | "in_progress" | "done";

// How a status is shown in the UI (File view and map)
export const STATUS_LABELS: Record<ItemStatus, string> = {
  planned: "Planned",
  in_progress: "In progress",
  done: "Done",
};

export type Item = {
id: string;
projectId: string;
type: string;

title: string;
description: string | null;
status: ItemStatus;
isMvp: boolean;
positionX: number;
positionY: number;
// The main photo: a temporary link (stops working after about an hour), or null if there is no photo
imageUrl: string | null;
createdAt: string;
};

export type CreateItemInput = {
  title: string;
  type: string;
  description?: string;
  status?: ItemStatus;
  isMvp?: boolean;
};

// confirmRelationshipRemoval: send true after the user has agreed that a type change deletes
// the connections that are no longer allowed (see the 409 answer from PATCH /api/items/:id)
// positionX / positionY: where the item sits on the map, saved when a node is dragged
export type UpdateItemInput = Partial<CreateItemInput> & {
  positionX?: number;
  positionY?: number;
  confirmRelationshipRemoval?: boolean;
};

// The shape of what GET /api/templates/:key returns
export type Template = {
  key: string;
  label: string;
  itemTypes: {
    key: string;
    label: string;
    pluralLabel: string;
    countsTowardProgress: boolean;
    // "#RRGGBB", the type's color in the whole UI
    color: string;
  }[];
  relationshipTypes: {
    key: string;
    label: string;
    inverseLabel: string;
    allowCycles: boolean;
  }[];
  allowedCombinations: { source: string; relationship: string; target: string }[];
};