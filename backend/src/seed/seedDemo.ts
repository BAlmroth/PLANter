import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { pickGroupColor } from "../services/groups.js";
import { getTemplate } from "../templates/index.js";
import {
  DEMO_COLUMN_WIDTH,
  DEMO_ROW_HEIGHT,
  demoBacklogTasks,
  demoGroups,
  demoInspirations,
  demoItems,
  demoProject,
  demoRelationships,
  demoSprints,
} from "./demoPortfolio.js";

// Creates the demo project for one user. Run it again and the old demo project is replaced,
// so the seed can be repeated without piling up copies.
export async function seedDemoProject(userId: string) {
  const template = getTemplate(demoProject.template);
  if (!template) throw new Error(`Unknown template: ${demoProject.template}`);

  // Ids are made here (not by the database) so rows can point at each other before they exist
  const projectId = randomUUID();
  const itemIds = new Map<string, string>(demoItems.map((i) => [i.ref, randomUUID()]));
  const idOf = (ref: string) => {
    const id = itemIds.get(ref);
    if (!id) throw new Error(`Seed data points at an unknown item: ${ref}`);
    return id;
  };

  // The map position comes from the seed data (col and row), with the wide demo spacing
  const itemRows = demoItems.map((item) => ({
    id: idOf(item.ref),
    projectId,
    type: item.type,
    title: item.title,
    description: item.description ?? null,
    status: item.status,
    isMvp: item.isMvp ?? false,
    positionX: item.col * DEMO_COLUMN_WIDTH,
    positionY: item.row * DEMO_ROW_HEIGHT,
  }));

  const sprints = demoSprints.map((s) => ({ id: randomUUID(), ...s }));
  const taskRows = [
    ...sprints.flatMap((s) =>
      s.tasks.map((t) => ({ projectId, sprintId: s.id, title: t.title, done: t.done, itemId: t.item ? idOf(t.item) : null })),
    ),
    ...demoBacklogTasks.map((t) => ({ projectId, sprintId: null, title: t.title, done: t.done, itemId: t.item ? idOf(t.item) : null })),
  ];

  const groups = demoGroups.map((g) => ({ id: randomUUID(), ...g }));

  // One transaction: either the whole demo project exists afterwards, or nothing changed
  await prisma.$transaction([
    // Cascade deletes everything that belonged to the old demo project
    prisma.project.deleteMany({ where: { userId, name: demoProject.name } }),
    prisma.project.create({
      data: { id: projectId, userId, name: demoProject.name, template: demoProject.template, description: demoProject.description },
    }),
    prisma.item.createMany({ data: itemRows }),
    prisma.relationship.createMany({
      data: demoRelationships.map((r) => ({
        projectId,
        sourceItemId: idOf(r.source),
        targetItemId: idOf(r.target),
        type: r.type,
      })),
    }),
    prisma.itemDetail.createMany({
      data: demoItems.flatMap((item) =>
        (item.details ?? []).map((d) => ({ itemId: idOf(item.ref), title: d.title, url: d.url ?? null, text: d.text ?? null })),
      ),
    }),
    prisma.projectInspiration.createMany({
      data: demoInspirations.map((i) => ({ projectId, title: i.title, url: i.url ?? null, text: i.text ?? null, section: i.url ? "inspiration" : "moodboard" })),
    }),
    prisma.group.createMany({
      // Each group takes the next color, the same rule as when a user creates groups one by one
      data: groups.map((g, i) => ({
        id: g.id,
        projectId,
        name: g.name,
        description: g.description ?? null,
        color: pickGroupColor(template.groupColors, template.groupColors.slice(0, i)),
      })),
    }),
    prisma.groupItem.createMany({
      data: groups.flatMap((g) => g.items.map((ref) => ({ groupId: g.id, itemId: idOf(ref), projectId }))),
    }),
    prisma.sprint.createMany({ data: sprints.map((s) => ({ id: s.id, projectId, name: s.name })) }),
    prisma.task.createMany({ data: taskRows }),
  ]);

  return {
    projectId,
    items: itemRows.length,
    relationships: demoRelationships.length,
    groups: groups.length,
    sprints: sprints.length,
    tasks: taskRows.length,
  };
}
