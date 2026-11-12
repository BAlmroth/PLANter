import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { itemColorParamSchema } from "../schemas/itemColors.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { linkColor, listItemColors, unlinkColor } from "../services/itemColors.js";

// All links of a project: /api/projects/:projectId/item-colors
export const projectItemColorsRouter = Router({ mergeParams: true });
projectItemColorsRouter.use(requireAuth);

projectItemColorsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listItemColors(projectId, req.userId!));
});

// Link and unlink one color: /api/items/:itemId/colors/:colorId
export const itemColorsRouter = Router({ mergeParams: true });
itemColorsRouter.use(requireAuth);

itemColorsRouter.put("/:colorId", validate(itemColorParamSchema, "params"), async (req, res) => {
  const { itemId, colorId } = req.params as z.infer<typeof itemColorParamSchema>;
  res.json(await linkColor(itemId, colorId, req.userId!));
});

itemColorsRouter.delete("/:colorId", validate(itemColorParamSchema, "params"), async (req, res) => {
  const { itemId, colorId } = req.params as z.infer<typeof itemColorParamSchema>;
  await unlinkColor(itemId, colorId, req.userId!);
  res.status(204).end();
});
