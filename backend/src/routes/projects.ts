import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createProjectSchema, projectIdSchema } from "../schemas/projects.js";
import { createProject, getOwnedProject, listProjects } from "../services/projects.js";

export const projectsRouter = Router();

// every project router need a logged in user
projectsRouter.use(requireAuth);

projectsRouter.post("/", validate(createProjectSchema), async (req, res) => {
  const project = await createProject(req.userId!, req.body);
  res.status(201).json(project);
});

// List projects
projectsRouter.get("/", async (req, res) => {
  res.json(await listProjects(req.userId!));
});

// Get one project
projectsRouter.get("/:id", validate(projectIdSchema, "params"), async (req, res) => {
  // Express types params as string | string[]. validate() has already checked it is a uuid string.
  const { id } = req.params as z.infer<typeof projectIdSchema>;
  res.json(await getOwnedProject(id, req.userId!));
});

//update project

//delete