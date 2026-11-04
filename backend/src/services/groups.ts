import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateGroupInput, UpdateGroupInput } from "../schemas/groups.js";
import { getOwnedProject } from "./projects.js";

// Load the item ids of a group together with the group (only the column we need)
const withItemIds = { items: { select: { itemId: true } } } as const;

// The API sends a group with a plain list of item ids instead of the join table rows:
// { id, name, ..., itemIds: ["...", "..."] }
function toGroupResponse<T extends { items: { itemId: string }[] }>(group: T) {
  const { items, ...rest } = group;
  return { ...rest, itemIds: items.map((row) => row.itemId) };
}

// GET USER GROUP
async function getOwnedGroup(groupId: string, userId: string) {
  const group = await prisma.group.findFirst({
    where: { id: groupId, project: { userId } },
  });
  if (!group) throw new HttpError(404, "Group not found");
  return group;
}

// LIST GROUPS IN A PROJECT (oldest first)
export async function listGroups(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  const groups = await prisma.group.findMany({
    where: { projectId },
    orderBy: { createdAt: "asc" },
    include: withItemIds,
  });
  return groups.map(toGroupResponse);
}

// CREATE GROUP (starts empty)
export async function createGroup(projectId: string, userId: string, input: CreateGroupInput) {
  await getOwnedProject(projectId, userId);
  const group = await prisma.group.create({
    data: {
      projectId,
      name: input.name,
      ...(input.description !== undefined && { description: input.description }),
    },
    include: withItemIds,
  });
  return toGroupResponse(group);
}

// UPDATE GROUP (name and/or description)
export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  await getOwnedGroup(groupId, userId);
  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
    },
    include: withItemIds,
  });
  return toGroupResponse(group);
}

// DELETE GROUP
// Its items are not deleted: only the group_items rows go (onDelete: Cascade on the join table).
export async function deleteGroup(groupId: string, userId: string) {
  await getOwnedGroup(groupId, userId);
  await prisma.group.delete({ where: { id: groupId } });
}

// ADD AN ITEM TO A GROUP
// The item must be in the group's project. The database checks this too (composite foreign key),
// but this gives a clean 404 instead of a database error. Adding it twice is not an error.
export async function addItemToGroup(groupId: string, itemId: string, userId: string) {
  const group = await getOwnedGroup(groupId, userId);
  const item = await prisma.item.findFirst({
    where: { id: itemId, projectId: group.projectId },
    select: { id: true },
  });
  if (!item) throw new HttpError(404, "Item not found");

  await prisma.groupItem.upsert({
    where: { groupId_itemId: { groupId, itemId } },
    create: { groupId, itemId, projectId: group.projectId },
    update: {},
  });
}

// REMOVE AN ITEM FROM A GROUP (the item itself stays). Removing it twice is not an error.
export async function removeItemFromGroup(groupId: string, itemId: string, userId: string) {
  await getOwnedGroup(groupId, userId);
  await prisma.groupItem.deleteMany({ where: { groupId, itemId } });
}
