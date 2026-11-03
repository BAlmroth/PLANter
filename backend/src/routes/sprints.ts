import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { createSprintSchema, sprintIdSchema, updateSprintSchema } from "../schemas/sprints.js";
import { createSprint, deleteSprint, listSprints, updateSprint } from "../services/sprints.js";

// Sprints are listed and created inside a project: /api/projects/:projectId/sprints
export const projectSprintsRouter = Router({ mergeParams: true });
projectSprintsRouter.use(requireAuth);

projectSprintsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listSprints(projectId, req.userId!));
});

projectSprintsRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createSprintSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    res.status(201).json(await createSprint(projectId, req.userId!, req.body));
  },
);

// One sprint is identified by its id alone: /api/sprints/:id
export const sprintsRouter = Router();
sprintsRouter.use(requireAuth);

sprintsRouter.patch(
  "/:id",
  validate(sprintIdSchema, "params"),
  validate(updateSprintSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof sprintIdSchema>;
    res.json(await updateSprint(id, req.userId!, req.body));
  },
);

// Delete a sprint (its tasks stay, without a sprint)
sprintsRouter.delete("/:id", validate(sprintIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof sprintIdSchema>;
  await deleteSprint(id, req.userId!);
  res.status(204).end();
});
