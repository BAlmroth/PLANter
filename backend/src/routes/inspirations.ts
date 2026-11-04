import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { createInspirationSchema, inspirationIdSchema, updateInspirationSchema } from "../schemas/inspirations.js";
import { createInspiration, deleteInspiration, listInspirations, updateInspiration } from "../services/inspirations.js";

// Listed and created inside a project: /api/projects/:projectId/inspirations
export const projectInspirationsRouter = Router({ mergeParams: true });
projectInspirationsRouter.use(requireAuth);

projectInspirationsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listInspirations(projectId, req.userId!));
});

projectInspirationsRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createInspirationSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    res.status(201).json(await createInspiration(projectId, req.userId!, req.body));
  },
);

// One entry is identified by its id alone: /api/inspirations/:id
export const inspirationsRouter = Router();
inspirationsRouter.use(requireAuth);

inspirationsRouter.patch(
  "/:id",
  validate(inspirationIdSchema, "params"),
  validate(updateInspirationSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof inspirationIdSchema>;
    res.json(await updateInspiration(id, req.userId!, req.body));
  },
);

inspirationsRouter.delete("/:id", validate(inspirationIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof inspirationIdSchema>;
  await deleteInspiration(id, req.userId!);
  res.status(204).end();
});
