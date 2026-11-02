import { prisma } from "../lib/prisma.js";
import type { Template } from "../templates/index.js";
import { getTemplate } from "../templates/index.js";
import { getOwnedProject } from "./projects.js";

export type ItemStatus = "planned" | "in_progress" | "done";

export type ProgressItem = { type: string; status: ItemStatus };

export type ProgressCount = { done: number; total: number; percent: number };

export type CategoryProgress = ProgressCount & { key: string };

export type ProjectProgress = ProgressCount & { categories: CategoryProgress[] };

// Completion = done / (planned + in_progress + done). In progress counts as not finished.
export function countProgress(items: ProgressItem[]): ProgressCount {
  const total = items.length;
  const done = items.filter((item) => item.status === "done").length;

  // An empty project or category is 0%, never a division by zero
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);

  return { done, total, percent };
}

// Only item types that count toward progress in the template are included.
// Items of other types (and unknown types) are ignored.
export function calculateProgress(template: Template, items: ProgressItem[]): ProjectProgress {
  const countedKeys = template.itemTypes
    .filter((itemType) => itemType.countsTowardProgress)
    .map((itemType) => itemType.key);

  const countedItems = items.filter((item) => countedKeys.includes(item.type));

  // One entry per counted type, in template order, so empty categories show as 0%
  const categories = countedKeys.map((key) => ({
    key,
    ...countProgress(countedItems.filter((item) => item.type === key)),
  }));

  return { ...countProgress(countedItems), categories };
}

// GET PROJECT PROGRESS
// The ownership check runs first. Its 404 is the same answer for "not yours" and "does not exist".
export async function getProjectProgress(projectId: string, userId: string): Promise<ProjectProgress> {
  const project = await getOwnedProject(projectId, userId);

  // A project with an unknown template is a data bug, not a user mistake, so it throws a plain Error (500)
  const template = getTemplate(project.template);
  if (!template) throw new Error(`Unknown template "${project.template}" on project ${projectId}`);

  const items = await prisma.item.findMany({
    where: { projectId },
    select: { type: true, status: true },
  });

  return calculateProgress(template, items);
}
