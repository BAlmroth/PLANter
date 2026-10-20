import { prisma } from "../lib/prisma.js";
import type { CreateProjectInput } from "../schemas/projects.js";

// Creates a project owned by the logged-in user.
export function createProject(userId: string, input: CreateProjectInput) {
  return prisma.project.create({
    data: { ...input, userId },
  });
}

// Lists only this user's projects, newest first
export function listProjects(userId: string) {
  return prisma.project.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
