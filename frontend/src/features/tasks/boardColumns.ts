import type { ItemStatus } from "../items/types";
import type { Task } from "./types";

// The board columns, left to right. The same three statuses as an item.
export const BOARD_COLUMNS: ItemStatus[] = ["planned", "in_progress", "done"];

// The column to the left of a status, or null for the first one
export function previousStatus(status: ItemStatus): ItemStatus | null {
  return BOARD_COLUMNS[BOARD_COLUMNS.indexOf(status) - 1] ?? null;
}

// The column to the right of a status, or null for the last one
export function nextStatus(status: ItemStatus): ItemStatus | null {
  return BOARD_COLUMNS[BOARD_COLUMNS.indexOf(status) + 1] ?? null;
}

// Which tasks the board shows: "all", "none" (tasks without a sprint) or one sprint id
export function tasksForScope(tasks: Task[], scope: string): Task[] {
  if (scope === "all") return tasks;
  if (scope === "none") return tasks.filter((task) => task.sprintId === null);
  return tasks.filter((task) => task.sprintId === scope);
}
