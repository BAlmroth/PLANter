import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import { getOwnedItem } from "./items.js";
import { getOwnedProject } from "./projects.js";

// Which palette colors an item uses. A color belongs to the project, items only link to it.

// LIST ALL LINKS IN A PROJECT (the frontend groups them per item or per color)
export async function listItemColors(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.itemColor.findMany({ where: { projectId }, select: { itemId: true, colorId: true } });
}

// LINK A COLOR TO AN ITEM. Linking twice does nothing (the same link is returned).
// The item is loaded with the owner filter, and the color is looked up in the item's project, so a color
// from another project (or another user) looks like it does not exist: 404.
export async function linkColor(itemId: string, colorId: string, userId: string) {
  const item = await getOwnedItem(itemId, userId);
  const color = await prisma.projectColor.findFirst({
    where: { id: colorId, projectId: item.projectId },
    select: { id: true },
  });
  if (!color) throw new HttpError(404, "Color not found");

  return prisma.itemColor.upsert({
    where: { itemId_colorId: { itemId, colorId } },
    update: {},
    create: { itemId, colorId, projectId: item.projectId },
    select: { itemId: true, colorId: true },
  });
}

// UNLINK A COLOR FROM AN ITEM (the color stays in the palette)
export async function unlinkColor(itemId: string, colorId: string, userId: string) {
  await getOwnedItem(itemId, userId);
  const { count } = await prisma.itemColor.deleteMany({ where: { itemId, colorId } });
  if (count === 0) throw new HttpError(404, "Color is not linked to this item");
}
