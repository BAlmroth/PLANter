import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateColorInput, UpdateColorInput } from "../schemas/colors.js";
import { getOwnedProject } from "./projects.js";

// LIST THE PALETTE OF A PROJECT (oldest first)
export async function listColors(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  return prisma.projectColor.findMany({ where: { projectId }, orderBy: { createdAt: "asc" } });
}

// CREATE COLOR
export async function createColor(projectId: string, userId: string, input: CreateColorInput) {
  await getOwnedProject(projectId, userId);
  return prisma.projectColor.create({
    data: { projectId, hex: input.hex, ...(input.name && { name: input.name }) },
  });
}

// GET USER COLOR
// Not owned and not existing look the same: 404
async function getOwnedColor(id: string, userId: string) {
  const color = await prisma.projectColor.findFirst({ where: { id, project: { userId } }, select: { id: true } });
  if (!color) throw new HttpError(404, "Color not found");
}

// UPDATE COLOR (hex and/or name). An empty name is stored as null.
export async function updateColor(id: string, userId: string, input: UpdateColorInput) {
  await getOwnedColor(id, userId);
  return prisma.projectColor.update({
    where: { id },
    data: {
      ...(input.hex !== undefined && { hex: input.hex }),
      ...(input.name !== undefined && { name: input.name || null }),
    },
  });
}

// DELETE COLOR
export async function deleteColor(id: string, userId: string) {
  await getOwnedColor(id, userId);
  await prisma.projectColor.delete({ where: { id } });
}
