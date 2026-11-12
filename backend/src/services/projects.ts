import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/projects.js";
import { getTemplate } from "../templates/index.js";
import { pickGroupColor } from "./groupColor.js";
import { deleteImageFiles } from "./images.js";
import { startPosition } from "./itemLayout.js";

//CREATE PROJECT
// With optional starter content from the new-project page ("add the things you already know").
// Everything is checked and prepared first, then saved in one transaction: if any row fails,
// nothing is saved, so the user never gets half a project.
export async function createProject(userId: string, input: CreateProjectInput) {
  const { name, template: templateKey, description, items = [], groups = [], tasks = [] } = input;
  const template = getTemplate(templateKey);
  // Zod has already checked the key, so this only happens on a bug (500)
  if (!template) throw new Error(`Unknown template: ${templateKey}`);

  // Item types come from the template, never hard-coded. Checked before anything is saved.
  const typeKeys = template.itemTypes.map((t) => t.key);
  const unknownTypes = items.map((item) => item.type).filter((type) => !typeKeys.includes(type));
  if (unknownTypes.length > 0) {
    throw new HttpError(400, "Invalid request body", {
      formErrors: [],
      fieldErrors: { items: [`Unknown item type for this template: ${unknownTypes.join(", ")}`] },
    });
  }

  // Map position: each item takes the next free spot in its category's column.
  // The rows placed so far are passed in, so two pages do not land on the same spot.
  const itemRows: { type: string; title: string; positionX: number; positionY: number }[] = [];
  for (const item of items) {
    itemRows.push({ ...item, ...startPosition(typeKeys, item.type, itemRows) });
  }

  // Color: the next one no group has yet, same rule as when a group is created later
  const groupRows: { name: string; color: string }[] = [];
  for (const group of groups) {
    groupRows.push({ name: group.name, color: pickGroupColor(template.groupColors, groupRows.map((g) => g.color)) });
  }

  // tx is a Prisma client that runs inside the transaction. If anything in here throws,
  // Postgres rolls back every row created in it, including the project.
  return prisma.$transaction(async (tx) => {
    const project = await tx.project.create({
      data: { name, template: templateKey, userId, ...(description !== undefined && { description }) },
    });
    const projectId = project.id;
    await tx.item.createMany({ data: itemRows.map((row) => ({ ...row, projectId })) });
    await tx.group.createMany({ data: groupRows.map((row) => ({ ...row, projectId })) });
    await tx.task.createMany({ data: tasks.map((task) => ({ title: task.title, projectId })) });
    return project;
  });
}

// LIST USER PROJECTS 
export function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

//GET USER PROJECT
//check if user has a project with requested id
export async function getOwnedProject(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
  });
  if (!project) throw new HttpError(404, "Project not found");
  return project;
}


// UPDATE PROJECT
// Ownership is checked first. If it doesn't throw, the user owns the project,
// so the update can safely use the id alone.
export async function updateProject(projectId: string, userId: string, input: UpdateProjectInput) {
  await getOwnedProject(projectId, userId);
  
  const { name, description } = input;
  return prisma.project.update({
    where: { id: projectId },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
    },
  });
}

// DELETE PROJECT
// Its items, relationships, tasks and sprints are deleted with it (cascade in the schema).
// The cascade only removes database rows, so the inspiration image files are deleted here.
export async function deleteProject(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  // Collect the paths before the rows are gone
  const where = { projectId, imagePath: { not: null } };
  const select = { imagePath: true };
  const [inspirations, items, details] = await Promise.all([
    prisma.projectInspiration.findMany({ where, select }),
    prisma.item.findMany({ where, select }),
    prisma.itemDetail.findMany({ where: { item: { projectId }, imagePath: { not: null } }, select }),
  ]);
  await prisma.project.delete({ where: { id: projectId } });
  await deleteImageFiles([...inspirations, ...items, ...details]);
}