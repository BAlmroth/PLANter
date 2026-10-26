import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateItemInput, UpdateItemInput } from "../schemas/items.js";
import { relationshipRuleSchema } from "../schemas/relationships.js";
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

// Ids of the item's relationships that would break the template rules if the item got newType
async function findRelationshipsInvalidAfterTypeChange(itemId: string, newType: string, templateKey: string) {
  const template = getTemplate(templateKey);
  if (!template) throw new Error(`Project has an unknown template: ${templateKey}`);
  const ruleSchema = relationshipRuleSchema(template);

  const relationships = await prisma.relationship.findMany({
    where: { OR: [{ sourceItemId: itemId }, { targetItemId: itemId }] },
    include: { source: { select: { type: true } }, target: { select: { type: true } } },
  });

  return relationships
    .filter((r) => {
      const sourceType = r.sourceItemId === itemId ? newType : r.source.type;
      const targetType = r.targetItemId === itemId ? newType : r.target.type;
      return !ruleSchema.safeParse({ sourceType, type: r.type, targetType }).success;
    })
    .map((r) => r.id);
}

// UPDATE ITEM
// Changing the type can make existing relationships invalid. Then the client gets a 409 with the
// number, and must send confirmRelationshipRemoval: true to delete them and change the type.
export async function updateItem(itemId: string, userId: string, input: UpdateItemInput) {
  const item = await getOwnedItem(itemId, userId);
  const { title, type, description, status, isMvp, confirmRelationshipRemoval } = input;

  let invalidIds: string[] = [];
  if (type !== undefined) {
    const project = await getOwnedProject(item.projectId, userId);
    checkItemTypeInTemplate(project.template, type);

    if (type !== item.type) {
      invalidIds = await findRelationshipsInvalidAfterTypeChange(itemId, type, project.template);
      if (invalidIds.length > 0 && !confirmRelationshipRemoval) {
        throw new HttpError(409, "Changing the type would delete connections that are no longer allowed", {
          invalidRelationships: invalidIds.length,
        });
      }
    }
  }

  const data = {
    ...(title !== undefined && { title }),
    ...(type !== undefined && { type }),
    ...(description !== undefined && { description }),
    ...(status !== undefined && { status }),
    ...(isMvp !== undefined && { isMvp }),
  };

  // Delete and update together: either both happen or neither
  const [, updated] = await prisma.$transaction([
    prisma.relationship.deleteMany({ where: { id: { in: invalidIds } } }),
    prisma.item.update({ where: { id: itemId }, data }),
  ]);
  return updated;
}

// DELETE ITEM
// Its relationships and tasks are deleted with it (cascade in the schema).
export async function deleteItem(itemId: string, userId: string) {
  await getOwnedItem(itemId, userId);
  await prisma.item.delete({ where: { id: itemId } });
}
