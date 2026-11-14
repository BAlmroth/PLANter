import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import {
  relationshipRuleSchema,
  type CreateRelationshipInput,
  type UpdateRelationshipInput,
} from "../schemas/relationships.js";
import { getTemplate, type Template } from "../templates/index.js";
import { getOwnedProject } from "./projects.js";

type Edge = { sourceItemId: string; targetItemId: string };

// An amount is only allowed on types that have hasQuantity in the template ("made from 20 Wood"),
// never on for example "upgrades to". Read from the template, not hard-coded per type.
function assertQuantityAllowed(template: Template, type: string, quantity: number | null | undefined) {
  if (quantity === undefined || quantity === null) return;
  const typeRule = template.relationshipTypes.find((t) => t.key === type);
  if (!typeRule?.hasQuantity) {
    throw new HttpError(400, "This type of connection cannot have an amount");
  }
}

// Would adding source -> target create a loop? Yes if source can already be reached from target
// by following the existing arrows (depth-first search with a list of items still to visit).
export function wouldCreateCycle(edges: Edge[], sourceId: string, targetId: string): boolean {
  const toVisit = [targetId];
  const visited = new Set<string>();

  while (toVisit.length > 0) {
    const current = toVisit.pop()!;
    if (current === sourceId) return true;
    if (visited.has(current)) continue;
    visited.add(current);
    for (const edge of edges) {
      if (edge.sourceItemId === current) toVisit.push(edge.targetItemId);
    }
  }
  return false;
}

// CREATE RELATIONSHIP
// The body has no projectId. Both items are loaded in one query that also filters on the owner,
// and the project id of the new row comes from those items.
export async function createRelationship(userId: string, input: CreateRelationshipInput) {
  const { sourceItemId, targetItemId, type, quantity } = input;

  const items = await prisma.item.findMany({
    where: { id: { in: [sourceItemId, targetItemId] }, project: { userId } },
    include: { project: { select: { template: true } } },
  });
  const source = items.find((i) => i.id === sourceItemId);
  const target = items.find((i) => i.id === targetItemId);

  // Missing, not owned or in different projects: all look the same to the client
  if (!source || !target || source.projectId !== target.projectId) {
    throw new HttpError(404, "Item not found");
  }

  const template = getTemplate(source.project.template);
  if (!template) throw new Error(`Project has an unknown template: ${source.project.template}`);

  // Zod judges the combination, using the item types we just looked up
  const rule = relationshipRuleSchema(template).safeParse({
    sourceType: source.type,
    type,
    targetType: target.type,
  });
  if (!rule.success) {
    throw new HttpError(400, "Invalid relationship", z.flattenError(rule.error));
  }
  assertQuantityAllowed(template, type, quantity);

  // Types like belongs_to must not loop (A belongs to B belongs to A)
  const typeRule = template.relationshipTypes.find((t) => t.key === type);
  if (typeRule && !typeRule.allowCycles) {
    const sameTypeEdges = await prisma.relationship.findMany({
      where: { projectId: source.projectId, type },
      select: { sourceItemId: true, targetItemId: true },
    });
    if (wouldCreateCycle(sameTypeEdges, sourceItemId, targetItemId)) {
      throw new HttpError(400, "This connection would create a loop");
    }
  }

  try {
    return await prisma.relationship.create({
      // No amount sent = NULL in the database
      data: { projectId: source.projectId, sourceItemId, targetItemId, type, quantity: quantity ?? null },
    });
  } catch (err) {
    // P2002 = unique constraint failed: same source, target and type already exists
    if (err instanceof Error && "code" in err && err.code === "P2002") {
      throw new HttpError(400, "These items are already connected with this relationship");
    }
    throw err;
  }
}

// LIST RELATIONSHIPS IN A PROJECT
export async function listRelationships(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.relationship.findMany({
    where: { projectId },
    orderBy: { id: "asc" },
  });
}

// UPDATE RELATIONSHIP (only the amount)
// Same ownership check as delete: not owned looks like not found (404).
export async function updateRelationship(relationshipId: string, userId: string, input: UpdateRelationshipInput) {
  const relationship = await prisma.relationship.findFirst({
    where: { id: relationshipId, project: { userId } },
    include: { project: { select: { template: true } } },
  });
  if (!relationship) throw new HttpError(404, "Relationship not found");

  const template = getTemplate(relationship.project.template);
  if (!template) throw new Error(`Project has an unknown template: ${relationship.project.template}`);
  assertQuantityAllowed(template, relationship.type, input.quantity);

  return prisma.relationship.update({
    where: { id: relationshipId },
    data: { quantity: input.quantity },
  });
}

// DELETE RELATIONSHIP
// Ownership goes through the project, same as for items. Not owned looks like not found (404).
export async function deleteRelationship(relationshipId: string, userId: string) {
  const relationship = await prisma.relationship.findFirst({
    where: { id: relationshipId, project: { userId } },
  });
  if (!relationship) throw new HttpError(404, "Relationship not found");
  await prisma.relationship.delete({ where: { id: relationshipId } });
}
