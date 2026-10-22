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