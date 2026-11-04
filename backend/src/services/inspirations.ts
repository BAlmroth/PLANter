import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateInspirationInput, UpdateInspirationInput } from "../schemas/inspirations.js";
import { getOwnedProject } from "./projects.js";

// LIST INSPIRATION IN A PROJECT (oldest first)
export async function listInspirations(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.projectInspiration.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

// CREATE INSPIRATION
export async function createInspiration(projectId: string, userId: string, input: CreateInspirationInput) {
  await getOwnedProject(projectId, userId);
  return prisma.projectInspiration.create({
    data: {
      projectId,
      title: input.title,
      ...(input.url !== undefined && { url: input.url }),
      ...(input.text !== undefined && { text: input.text }),
    },
  });
}

// GET USER INSPIRATION
// Not owned and not existing look the same: 404
async function getOwnedInspiration(id: string, userId: string) {
  const inspiration = await prisma.projectInspiration.findFirst({
    where: { id, project: { userId } },
    select: { id: true },
  });
  if (!inspiration) throw new HttpError(404, "Inspiration not found");
}

// UPDATE INSPIRATION (title, url and/or text). An empty url or text is stored as null.
export async function updateInspiration(id: string, userId: string, input: UpdateInspirationInput) {
  await getOwnedInspiration(id, userId);
  return prisma.projectInspiration.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.url !== undefined && { url: input.url || null }),
      ...(input.text !== undefined && { text: input.text || null }),
    },
  });
}

// DELETE INSPIRATION
export async function deleteInspiration(id: string, userId: string) {
  await getOwnedInspiration(id, userId);
  await prisma.projectInspiration.delete({ where: { id } });
}
