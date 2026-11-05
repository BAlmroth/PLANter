import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { deleteImages, getSignedUrls, uploadImage } from "../lib/storage.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateInspirationInput, UpdateInspirationInput } from "../schemas/inspirations.js";
import { detectImageKind } from "./imageFiles.js";
import { getOwnedProject } from "./projects.js";

// Every response has the same shape: imagePath (the internal storage path) is replaced by imageUrl,
// a temporary link that stops working after an hour. imageUrl is null when there is no image.
type InspirationRow = Awaited<ReturnType<typeof prisma.projectInspiration.findMany>>[number];
async function withImageUrls(rows: InspirationRow[]) {
  const urls = await getSignedUrls(rows.flatMap((row) => (row.imagePath ? [row.imagePath] : [])));
  return rows.map(({ imagePath, ...row }) => ({ ...row, imageUrl: imagePath ? (urls.get(imagePath) ?? null) : null }));
}

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
      ...(input.url !== undefined && { url: input.url }),
      ...(input.text !== undefined && { text: input.text }),
    },
  });
  return (await withImageUrls([created]))[0];
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
  return (await withImageUrls([updated]))[0];
}

// SET (or replace) THE IMAGE of an inspiration entry
export async function setInspirationImage(id: string, userId: string, file: Buffer) {
  const inspiration = await getOwnedInspiration(id, userId);

  // Check what the file really is. The path is made by us: the client never chooses a file name.
  const kind = detectImageKind(file);
  if (!kind) throw new HttpError(400, "File must be a JPEG, PNG or WebP image");
  const imagePath = `${inspiration.projectId}/${randomUUID()}.${kind.extension}`;

  await uploadImage(imagePath, file, kind.contentType);
  const updated = await prisma.projectInspiration.update({ where: { id }, data: { imagePath } });

  // The old file is no longer used. Do this last, so a failed upload never loses the old image.
  if (inspiration.imagePath) await deleteImages([inspiration.imagePath]);
  return (await withImageUrls([updated]))[0];
}

// DELETE INSPIRATION (and its image file, if it has one)
export async function deleteInspiration(id: string, userId: string) {
  const inspiration = await getOwnedInspiration(id, userId);
  await prisma.projectInspiration.delete({ where: { id } });
  if (inspiration.imagePath) await deleteImages([inspiration.imagePath]);
}
