import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateProjectInput, UpdateProjectInput } from "../schemas/projects.js";

//CREATE PROJECT
export function createProject(userId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: { ...input, userId },
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
export async function deleteProject(projectId: string, userId: string) {
  await getOwnedProject(projectId, userId);
  await prisma.project.delete({ where: { id: projectId } });
}