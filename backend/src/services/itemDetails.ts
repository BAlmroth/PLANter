import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateItemDetailInput, UpdateItemDetailInput } from "../schemas/itemDetails.js";
import { deleteImageFiles, saveImageFile, withImageUrl, withImageUrls } from "./images.js";
import { getOwnedItem } from "./items.js";

// Detail rows of an item: links, notes and images (the item's moodboard).
// They have no project_id: ownership is checked through the item.

// LIST THE DETAILS OF AN ITEM (oldest first)
export async function listItemDetails(itemId: string, userId: string) {
  await getOwnedItem(itemId, userId);
  const rows = await prisma.itemDetail.findMany({ where: { itemId }, orderBy: { createdAt: "asc" } });
  return withImageUrls(rows);
}

// CREATE DETAIL
export async function createItemDetail(itemId: string, userId: string, input: CreateItemDetailInput) {
  await getOwnedItem(itemId, userId);
  const created = await prisma.itemDetail.create({
    data: {
      itemId,
      title: input.title,
      ...(input.url !== undefined && { url: input.url }),
      ...(input.text !== undefined && { text: input.text }),
    },
  });
  return await withImageUrl(created);
}

// GET USER DETAIL, together with the project it belongs to (needed for the image path)
// Not owned and not existing look the same: 404
async function getOwnedItemDetail(id: string, userId: string) {
  const detail = await prisma.itemDetail.findFirst({
    where: { id, item: { project: { userId } } },
    include: { item: { select: { projectId: true } } },
  });
  if (!detail) throw new HttpError(404, "Detail not found");
  return detail;
}

// UPDATE DETAIL (title, url and/or text). An empty url or text is stored as null.
export async function updateItemDetail(id: string, userId: string, input: UpdateItemDetailInput) {
  await getOwnedItemDetail(id, userId);
  const updated = await prisma.itemDetail.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.url !== undefined && { url: input.url || null }),
      ...(input.text !== undefined && { text: input.text || null }),
    },
  });
  return await withImageUrl(updated);
}

// SET (or replace) THE IMAGE of a detail row
export async function setItemDetailImage(id: string, userId: string, file: Buffer) {
  const detail = await getOwnedItemDetail(id, userId);
  const imagePath = await saveImageFile(detail.item.projectId, file);
  const updated = await prisma.itemDetail.update({ where: { id }, data: { imagePath } });
  // The old file is no longer used. Do this last, so a failed upload never loses the old image.
  await deleteImageFiles([detail]);
  return await withImageUrl(updated);
}

// DELETE DETAIL (and its image file, if it has one)
export async function deleteItemDetail(id: string, userId: string) {
  const detail = await getOwnedItemDetail(id, userId);
  await prisma.itemDetail.delete({ where: { id } });
  await deleteImageFiles([detail]);
}
