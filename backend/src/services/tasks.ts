import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateTaskInput, UpdateTaskInput } from "../schemas/tasks.js";
import { getOwnedProject } from "./projects.js";

// GET USER TASK
async function getOwnedTask(taskId: string, userId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, project: { userId } },
  });
  if (!task) throw new HttpError(404, "Task not found");
  return task;
}

// The item must be in the same project as the task. The database checks this too (composite
// foreign key), but this gives a clean 404 instead of a database error.
async function checkItemInProject(itemId: string, projectId: string) {
  const item = await prisma.item.findFirst({ where: { id: itemId, projectId }, select: { id: true } });
  if (!item) throw new HttpError(404, "Item not found");
}

// LIST TASKS IN A PROJECT
// Open tasks first, then by title (tasks have no creation time)
export async function listTasks(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.task.findMany({
    where: { projectId },
    orderBy: [{ done: "asc" }, { title: "asc" }],
  });
}

// CREATE TASK
export async function createTask(projectId: string, userId: string, input: CreateTaskInput) {
  await getOwnedProject(projectId, userId);
  const { title, itemId } = input;
  if (itemId !== undefined) await checkItemInProject(itemId, projectId);

  return prisma.task.create({
    data: { projectId, title, ...(itemId !== undefined && { itemId }) },
  });
}

// UPDATE TASK
export async function updateTask(taskId: string, userId: string, input: UpdateTaskInput) {
  const task = await getOwnedTask(taskId, userId);
  const { title, done, itemId } = input;
  if (itemId) await checkItemInProject(itemId, task.projectId);

  return prisma.task.update({
    where: { id: taskId },
    data: {
      ...(title !== undefined && { title }),
      ...(done !== undefined && { done }),
      ...(itemId !== undefined && { itemId }),
    },
  });
}

// DELETE TASK
export async function deleteTask(taskId: string, userId: string) {
  await getOwnedTask(taskId, userId);
  await prisma.task.delete({ where: { id: taskId } });
}
