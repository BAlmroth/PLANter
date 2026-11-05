 import { prisma } from "../lib/prisma.js";
import type { Template } from "../templates/index.js";
import { getTemplate } from "../templates/index.js";
import { getOwnedProject } from "./projects.js";

export type WarningItem = { id: string; type: string; title: string; status: string; isMvp: boolean };
export type WarningRelationship = { sourceItemId: string; targetItemId: string; type: string };
export type WarningTask = { itemId: string | null };

export type Warning = {
  rule: string;
  itemId: string;
  itemTitle: string;
  message: string;
};

// The MVP rule is not tied to an item type, so it is not in the template
export const MVP_WITHOUT_TASKS_RULE = "mvp_without_tasks";

// Pure function: no database, so it is easy to test.
// Returns one warning per (rule, item) that breaks a rule.
export function findWarnings(
  template: Template,
  items: WarningItem[],
  relationships: WarningRelationship[],
  tasks: WarningTask[],
): Warning[] {
  const warnings: Warning[] = [];

  // 1. Template rules: a missing connection of a given type and direction
  for (const rule of template.warningRules) {
    for (const item of items.filter((i) => i.type === rule.itemType)) {
      const connected = relationships.some(
        (r) =>
          r.type === rule.relationship &&
          (rule.direction === "incoming" ? r.targetItemId : r.sourceItemId) === item.id,
      );
      if (!connected) {
        warnings.push({ rule: rule.key, itemId: item.id, itemTitle: item.title, message: rule.message });
      }
    }
  }

  // 2. An MVP item with no tasks. Done items are skipped: nothing is left to plan for them.
  const itemsWithTasks = new Set(tasks.map((t) => t.itemId));
  for (const item of items) {
    if (item.isMvp && item.status !== "done" && !itemsWithTasks.has(item.id)) {
      warnings.push({
        rule: MVP_WITHOUT_TASKS_RULE,
        itemId: item.id,
        itemTitle: item.title,
        message: "is part of the MVP but has no tasks",
      });
    }
  }

  return warnings;
}

// GET PROJECT WARNINGS
// The ownership check runs first. Its 404 is the same answer for "not yours" and "does not exist".
export async function getProjectWarnings(projectId: string, userId: string): Promise<Warning[]> {
  const project = await getOwnedProject(projectId, userId);

  // A project with an unknown template is a data bug, not a user mistake, so it throws a plain Error (500)
  const template = getTemplate(project.template);
  if (!template) throw new Error(`Unknown template "${project.template}" on project ${projectId}`);

  const [items, relationships, tasks] = await Promise.all([
    prisma.item.findMany({
      where: { projectId },
      select: { id: true, type: true, title: true, status: true, isMvp: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.relationship.findMany({
      where: { projectId },
      select: { sourceItemId: true, targetItemId: true, type: true },
    }),
    prisma.task.findMany({ where: { projectId, itemId: { not: null } }, select: { itemId: true } }),
  ]);

  return findWarnings(template, items, relationships, tasks);
}
