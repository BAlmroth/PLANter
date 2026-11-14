import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateSprintInput, UpdateSprintInput } from "../schemas/sprints.js";
import { getOwnedProject } from "./projects.js";

// GET USER SPRINT
async function getOwnedSprint(sprintId: string, userId: string) {
  const sprint = await prisma.sprint.findFirst({
    where: { id: sprintId, project: { userId } },
  });
  if (!sprint) throw new HttpError(404, "Sprint not found");
  return sprint;
}

// Compares names the way a person would: numbers count as numbers ("Sprint 2" before "Sprint 10"),
// and upper or lower case does not matter. Postgres sorts text letter by letter, so this runs in JS.
// The frontend sorts with the same rule (features/sprints/sortSprints.ts) after a create or rename.
const nameCollator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

export function sortByName<T extends { name: string }>(rows: T[]): T[] {
  return [...rows].sort((a, b) => nameCollator.compare(a.name, b.name));
}

// LIST SPRINTS IN A PROJECT
// Sprints have no creation time, so they are sorted by name
export async function listSprints(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return sortByName(await prisma.sprint.findMany({ where: { projectId } }));
}

// CREATE SPRINT
export async function createSprint(projectId: string, userId: string, input: CreateSprintInput) {
  await getOwnedProject(projectId, userId);
  return prisma.sprint.create({ data: { projectId, name: input.name } });
}

// UPDATE SPRINT
export async function updateSprint(sprintId: string, userId: string, input: UpdateSprintInput) {
  await getOwnedSprint(sprintId, userId);
  return prisma.sprint.update({
    where: { id: sprintId },
    data: { ...(input.name !== undefined && { name: input.name }) },
  });
}

// DELETE SPRINT
// Its tasks are not deleted: they go back to "no sprint" (onDelete: SetNull in the schema).
export async function deleteSprint(sprintId: string, userId: string) {
  await getOwnedSprint(sprintId, userId);
  await prisma.sprint.delete({ where: { id: sprintId } });
}
