import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { createProjectSchema } from "../schemas/projects.js";
import { createProject, listProjects } from "../services/projects.js";

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