export type ItemStatus = "planned" | "in_progress" | "done";

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
createdAt: string;
};

export type CreateItemInput = {
  title: string;
  type: string;
  description?: string;
  status?: ItemStatus;
  isMvp?: boolean;
};

export type UpdateItemInput = Partial<CreateItemInput>;

// The shape of what GET /api/templates/:key returns
export type Template = {
  key: string;
  label: string;
  itemTypes: {
    key: string;
    label: string;
    pluralLabel: string;
    countsTowardProgress: boolean;
  }[];
  relationshipTypes: {
    key: string;
    label: string;
    inverseLabel: string;
    allowCycles: boolean;
  }[];
  allowedCombinations: { source: string; relationship: string; target: string }[];
};