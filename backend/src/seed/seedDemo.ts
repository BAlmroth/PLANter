import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { prisma } from "../lib/prisma.js";
import { pickGroupColor } from "../services/groupColor.js";
import { getTemplate } from "../templates/index.js";
import { gameDemo } from "./demoGame.js";
import { portfolioDemo } from "./demoPortfolio.js";
import { DEMO_COLUMN_WIDTH, DEMO_ROW_HEIGHT, type DemoData, type SeedImage } from "./types.js";

// The demos the runner can create, by name: npm run seed:demo -- <user-id> [web|game]
export const DEMOS: Record<string, DemoData> = { web: portfolioDemo, game: gameDemo };

// Where the demo images are (seed/images/, next to this file)
export const SEED_IMAGE_DIR = new URL("./images/", import.meta.url);

export function readSeedImage(name: SeedImage) {
  return readFile(new URL(name, SEED_IMAGE_DIR));
}

// How images are stored. The real seed command (run.ts) passes the same functions the API uses
// (services/images.ts), so the files go to the private Supabase Storage bucket and are checked the
// same way. Without it, no images are uploaded or deleted: the rows get no image, and tests and a
// local database never talk to Supabase.
export type SeedStorage = {
  saveImage: (projectId: string, file: Buffer) => Promise<string>;
  deleteImages: (rows: { imagePath: string | null }[]) => Promise<void>;
};

// Creates a demo project for one user (the web portfolio unless another demo is given).
// Run it again and the old copy of THAT demo is replaced (found by name), so the seed can be
// repeated without piling up copies, and the other demo is left alone.
export async function seedDemoProject(userId: string, demo: DemoData = portfolioDemo, storage?: SeedStorage) {
  const {
    project: demoProject,
    items: demoItems,
    relationships: demoRelationships,
    groups: demoGroups,
    sprints: demoSprints,
    backlogTasks: demoBacklogTasks,
    inspirations: demoInspirations,
    colors: demoColors,
  } = demo;
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

  // IMAGES: uploaded before the rows are saved, because each row stores its file's path.
  // Every use gets its own file, so deleting one row never breaks another.
  const uploaded: { imagePath: string | null }[] = [];
  async function upload(name: SeedImage | undefined): Promise<string | null> {
    if (!name || !storage) return null;
    const imagePath = await storage.saveImage(projectId, await readSeedImage(name));
    uploaded.push({ imagePath });
    return imagePath;
  }

  // The old copy's files, collected before its rows are deleted (like deleteProject in services/projects.ts)
  const oldFiles = storage ? await findOldImageFiles(userId, demoProject.name) : [];

  try {
    // The map position comes from the seed data (col and row), with the wide demo spacing
    const itemRows = [];
    for (const item of demoItems) {
      itemRows.push({
        id: idOf(item.ref),
        projectId,
        type: item.type,
        title: item.title,
        description: item.description ?? null,
        conditions: item.conditions ?? null,
        status: item.status,
        isMvp: item.isMvp ?? false,
        positionX: item.col * DEMO_COLUMN_WIDTH,
        positionY: item.row * DEMO_ROW_HEIGHT,
        imagePath: await upload(item.image),
      });
    }

    const detailRows = [];
    for (const item of demoItems) {
      for (const d of item.details ?? []) {
        detailRows.push({ itemId: idOf(item.ref), title: d.title, url: d.url ?? null, text: d.text ?? null, imagePath: await upload(d.image) });
      }
    }

    const inspirationRows = [];
    for (const i of demoInspirations) {
      inspirationRows.push({
        projectId,
        title: i.title,
        url: i.url ?? null,
        text: i.text ?? null,
        section: i.section ?? (i.url ? ("inspiration" as const) : ("moodboard" as const)),
        imagePath: await upload(i.image),
      });
    }

    const sprints = demoSprints.map((s) => ({ id: randomUUID(), ...s }));
    const taskRows = [
      ...sprints.flatMap((s) =>
        s.tasks.map((t) => ({ projectId, sprintId: s.id, title: t.title, status: t.done ? ("done" as const) : ("planned" as const), itemId: t.item ? idOf(t.item) : null })),
      ),
      ...demoBacklogTasks.map((t) => ({ projectId, sprintId: null, title: t.title, status: t.done ? ("done" as const) : ("planned" as const), itemId: t.item ? idOf(t.item) : null })),
    ];

    const groups = demoGroups.map((g) => ({ id: randomUUID(), ...g }));
    const colors = demoColors.map((c) => ({ id: randomUUID(), ...c }));

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
          quantity: r.quantity ?? null,
        })),
      }),
      prisma.itemDetail.createMany({ data: detailRows }),
      prisma.projectInspiration.createMany({ data: inspirationRows }),
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
      // The palette, then which items use which color (both in this project, like the composite keys require)
      prisma.projectColor.createMany({
        data: colors.map((c) => ({ id: c.id, projectId, hex: c.hex.toUpperCase(), name: c.name ?? null })),
      }),
      prisma.itemColor.createMany({
        data: colors.flatMap((c) => (c.items ?? []).map((ref) => ({ itemId: idOf(ref), colorId: c.id, projectId }))),
      }),
      prisma.sprint.createMany({ data: sprints.map((s) => ({ id: s.id, projectId, name: s.name })) }),
      prisma.task.createMany({ data: taskRows }),
    ]);

    // Only now is the old copy really gone, so its files can go too
    if (storage) await storage.deleteImages(oldFiles);

    return {
      projectId,
      items: itemRows.length,
      relationships: demoRelationships.length,
      groups: groups.length,
      colors: colors.length,
      inspirations: inspirationRows.length,
      images: uploaded.length,
      sprints: sprints.length,
      tasks: taskRows.length,
    };
  } catch (err) {
    // Nothing was saved, so the files uploaded for this run would be left over: remove them
    if (storage) await storage.deleteImages(uploaded);
    throw err;
  }
}

// The image paths of the user's old copy of a demo (main photos, item details and inspiration)
async function findOldImageFiles(userId: string, name: string) {
  const projectWhere = { userId, name };
  const select = { imagePath: true };
  const [inspirations, items, details] = await Promise.all([
    prisma.projectInspiration.findMany({ where: { project: projectWhere, imagePath: { not: null } }, select }),
    prisma.item.findMany({ where: { project: projectWhere, imagePath: { not: null } }, select }),
    prisma.itemDetail.findMany({ where: { item: { project: projectWhere }, imagePath: { not: null } }, select }),
  ]);
  return [...inspirations, ...items, ...details];
}
