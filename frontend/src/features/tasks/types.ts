// The shape of what the task routes return
export type Task = {
  id: string;
  projectId: string;
  itemId: string | null; // the item the task is about, if any
  title: string;
  status: "planned" | "in_progress" | "done";
  sprintId: string | null;
};

export type CreateTaskInput = {
  title: string;
  itemId?: string;
  sprintId?: string;
};

// itemId and sprintId: null removes the link
export type UpdateTaskInput = {
  title?: string;
  status?: "planned" | "in_progress" | "done";
  itemId?: string | null;
  sprintId?: string | null;
};
