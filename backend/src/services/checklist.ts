import { prisma } from "../lib/prisma.js";
import type { Template } from "../templates/index.js";
import { findWarnings, loadWarningInput, MVP_WITHOUT_TASKS_RULE } from "./warnings.js";
import type { WarningItem, WarningRelationship, WarningTask } from "./warnings.js";

// "category": the project has no item of a category it usually needs (shown as "Yet to plan").
// "readiness": the rest of the "Before you start programming" list.
export type CheckKind = "category" | "readiness";

export type Check = {
  key: string;
  kind: CheckKind;
  label: string; // a todo, e.g. "Plan the tests"
  passed: boolean;
};

// Pure function: no database, so it is easy to test.
// Unlike findWarnings it returns every check, also the passed ones, so the UI can show ✓ and ✗.
export function buildChecklist(
  template: Template,
  items: WarningItem[],
  relationships: WarningRelationship[],
  tasks: WarningTask[],
  sprintCount: number,
): Check[] {
  // 1. Categories from the template: at least one item of the type
  const categoryChecks: Check[] = template.checklistItemTypes.map((entry) => ({
    key: `has_${entry.itemType}`,
    kind: "category",
    label: entry.label,
    passed: items.some((item) => item.type === entry.itemType),
  }));

  // 2. Readiness. Two checks reuse the item warnings, so the list and the "!" badges always agree.
  const warnings = findWarnings(template, items, relationships, tasks);
  const connectionWarnings = warnings.filter((w) => w.rule !== MVP_WITHOUT_TASKS_RULE);
  const mvpWarnings = warnings.filter((w) => w.rule === MVP_WITHOUT_TASKS_RULE);
  const hasMvp = items.some((item) => item.isMvp);

  const readinessChecks: Check[] = [
    { key: "has_mvp", kind: "readiness", label: "Mark the MVP items", passed: hasMvp },
    // Needs an MVP first, otherwise "every MVP item has tasks" would pass for an empty MVP
    { key: "mvp_has_tasks", kind: "readiness", label: "Add tasks to every MVP item", passed: hasMvp && mvpWarnings.length === 0 },
    { key: "has_sprint", kind: "readiness", label: "Create a sprint", passed: sprintCount > 0 },
    // Needs items first, otherwise an empty project would pass
    { key: "connections", kind: "readiness", label: "Fix missing connections", passed: items.length > 0 && connectionWarnings.length === 0 },
  ];

  return [...categoryChecks, ...readinessChecks];
}

// GET PROJECT CHECKLIST
// loadWarningInput checks ownership first (404), so the sprint count only runs for the owner's project.
export async function getProjectChecklist(projectId: string, userId: string): Promise<Check[]> {
  const { template, items, relationships, tasks } = await loadWarningInput(projectId, userId);
  const sprintCount = await prisma.sprint.count({ where: { projectId } });
  return buildChecklist(template, items, relationships, tasks, sprintCount);
}
