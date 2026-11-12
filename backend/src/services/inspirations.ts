import { prisma } from "../lib/prisma.js";
import { deleteImages } from "../lib/storage.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateInspirationInput, UpdateInspirationInput } from "../schemas/inspirations.js";
import { saveImageFile, withImageUrl, withImageUrls } from "./images.js";
import { getOwnedProject } from "./projects.js";

// LIST INSPIRATION IN A PROJECT (oldest first)
export async function listInspirations(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  const rows = await prisma.projectInspiration.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
  return withImageUrls(rows);
}

// CREATE INSPIRATION
export async function createInspiration(projectId: string, userId: string, input: CreateInspirationInput) {
  await getOwnedProject(projectId, userId);
  const created = await prisma.projectInspiration.create({
    data: {
      projectId,
      title: input.title,
      section: input.section,
      ...(input.url !== undefined && { url: input.url }),
      ...(input.text !== undefined && { text: input.text }),
    },
  });
  return await withImageUrl(created);
}

// GET USER INSPIRATION
// Not owned and not existing look the same: 404
async function getOwnedInspiration(id: string, userId: string) {
  const inspiration = await prisma.projectInspiration.findFirst({
    where: { id, project: { userId } },
    select: { id: true, projectId: true, imagePath: true },
  });
  if (!inspiration) throw new HttpError(404, "Inspiration not found");
  return inspiration;
}

// UPDATE INSPIRATION (title, url and/or text). An empty url or text is stored as null.
export async function updateInspiration(id: string, userId: string, input: UpdateInspirationInput) {
  await getOwnedInspiration(id, userId);
  const updated = await prisma.projectInspiration.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.url !== undefined && { url: input.url || null }),
      ...(input.text !== undefined && { text: input.text || null }),
    },
  });
  return await withImageUrl(updated);
}

// SET (or replace) THE IMAGE of an inspiration entry
export async function setInspirationImage(id: string, userId: string, file: Buffer) {
  const inspiration = await getOwnedInspiration(id, userId);

  const imagePath = await saveImageFile(inspiration.projectId, file);
  const updated = await prisma.projectInspiration.update({ where: { id }, data: { imagePath } });

  // The old file is no longer used. Do this last, so a failed upload never loses the old image.
  if (inspiration.imagePath) await deleteImages([inspiration.imagePath]);
  return await withImageUrl(updated);
}

// DELETE INSPIRATION (and its image file, if it has one)
export async function deleteInspiration(id: string, userId: string) {
  const inspiration = await getOwnedInspiration(id, userId);
  await prisma.projectInspiration.delete({ where: { id } });
  if (inspiration.imagePath) await deleteImages([inspiration.imagePath]);
}
