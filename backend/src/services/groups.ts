import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateGroupInput, UpdateGroupInput } from "../schemas/groups.js";
import { getTemplate } from "../templates/index.js";
import { getOwnedProject } from "./projects.js";

// The colors a group in a project with this template may have
function groupColorsOf(templateKey: string): string[] {
  return getTemplate(templateKey)?.groupColors ?? [];
}

// 400 unless the color is one of the template's group colors (Zod already made it "#RRGGBB")
function checkGroupColor(color: string, templateKey: string) {
  const allowed = groupColorsOf(templateKey);
  if (!allowed.includes(color)) {
    throw new HttpError(400, "color must be one of the group colors", { allowed });
  }
}

// The color for a new group when none was chosen: the first one no group in the project has yet.
// When all are taken, it starts over (the 9th group gets the 1st color again).
export function pickGroupColor(allowed: string[], usedColors: string[]): string {
  const color = allowed.find((c) => !usedColors.includes(c)) ?? allowed[usedColors.length % allowed.length];
  // Only possible if a template has no group colors: a mistake in the code, not in the request (500)
  if (!color) throw new Error("The template has no group colors");
  return color;
}

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
    // The template decides which colors are allowed
    include: { project: { select: { template: true } } },
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
  const project = await getOwnedProject(projectId, userId);

  let color: string;
  if (input.color !== undefined) {
    checkGroupColor(input.color, project.template);
    color = input.color;
  } else {
    const existing = await prisma.group.findMany({ where: { projectId }, select: { color: true } });
    color = pickGroupColor(groupColorsOf(project.template), existing.map((g) => g.color));
  }

  const group = await prisma.group.create({
    data: {
      projectId,
      name: input.name,
      color,
      ...(input.description !== undefined && { description: input.description }),
    },
    include: withItemIds,
  });
  return toGroupResponse(group);
}

// UPDATE GROUP (name, description and/or color)
export async function updateGroup(groupId: string, userId: string, input: UpdateGroupInput) {
  const owned = await getOwnedGroup(groupId, userId);
  if (input.color !== undefined) checkGroupColor(input.color, owned.project.template);
  const group = await prisma.group.update({
    where: { id: groupId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.color !== undefined && { color: input.color }),
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
