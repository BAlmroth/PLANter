import { prisma } from "../lib/prisma.js";
import { HttpError } from "../middleware/errorHandler.js";
import type { CreateProjectInput } from "../schemas/projects.js";

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