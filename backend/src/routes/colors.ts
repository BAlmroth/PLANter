import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { colorIdSchema, createColorSchema, updateColorSchema } from "../schemas/colors.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { createColor, deleteColor, listColors, updateColor } from "../services/colors.js";

// Listed and created inside a project: /api/projects/:projectId/colors
export const projectColorsRouter = Router({ mergeParams: true });
projectColorsRouter.use(requireAuth);

projectColorsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listColors(projectId, req.userId!));
});

projectColorsRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createColorSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    res.status(201).json(await createColor(projectId, req.userId!, req.body));
  },
);

// One color is identified by its id alone: /api/colors/:id
export const colorsRouter = Router();
colorsRouter.use(requireAuth);

colorsRouter.patch("/:id", validate(colorIdSchema, "params"), validate(updateColorSchema), async (req, res) => {
  const { id } = req.params as z.infer<typeof colorIdSchema>;
  res.json(await updateColor(id, req.userId!, req.body));
});

colorsRouter.delete("/:id", validate(colorIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof colorIdSchema>;
  await deleteColor(id, req.userId!);
  res.status(204).end();
});
