import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateItemInput, UpdateItemInput } from "../schemas/items.js";
import { getTemplate } from "../templates/index.js";
import { getOwnedProject } from "./projects.js";

// CHECK ITEM TYPE
function checkItemTypeInTemplate(templateKey: string, type: string) {
  const exists = getTemplate(templateKey)?.itemTypes.some((t) => t.key === type);
  if (!exists) {
    throw new HttpError(400, "Invalid request body", {
      formErrors: [],
      fieldErrors: { type: ["Unknown item type for this template"] },
    });
  }
}

// GET USER ITEM
export async function getOwnedItem(itemId: string, userId: string) {
  const item = await prisma.item.findFirst({
    where: { id: itemId, project: { userId } },
  });
  if (!item) throw new HttpError(404, "Item not found");
  return item;
}

// LIST ITEMS IN A PROJECT
export async function listItems(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.item.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
  });
}

// CREATE ITEM
// projectId comes from the URL, and getOwnedProject has checked that the user owns it.
export async function createItem(projectId: string, userId: string, input: CreateItemInput) {
  const project = await getOwnedProject(projectId, userId);
  const { title, type, description, status, isMvp } = input;
  checkItemTypeInTemplate(project.template, type);

  return prisma.item.create({
    data: {
      projectId,
      title,
      type,
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(isMvp !== undefined && { isMvp }),
    },
  });
}

// UPDATE ITEM
export async function updateItem(itemId: string, userId: string, input: UpdateItemInput) {
  const item = await getOwnedItem(itemId, userId);
  const { title, type, description, status, isMvp } = input;

  if (type !== undefined) {
    // TODO sprint 3: if the new type makes existing relationships invalid, reject unless the
    // client confirms with a flag, then delete them in one transaction (see todo.md)
    const project = await getOwnedProject(item.projectId, userId);
    checkItemTypeInTemplate(project.template, type);
  }

  return prisma.item.update({
    where: { id: itemId },
    data: {
      ...(title !== undefined && { title }),
      ...(type !== undefined && { type }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(isMvp !== undefined && { isMvp }),
    },
  });
}

// DELETE ITEM
// Its relationships and tasks are deleted with it (cascade in the schema).
export async function deleteItem(itemId: string, userId: string) {
  await getOwnedItem(itemId, userId);
  await prisma.item.delete({ where: { id: itemId } });
}
