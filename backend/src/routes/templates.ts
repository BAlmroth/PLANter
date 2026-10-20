import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { templateParamsSchema } from "../schemas/templates.js";
import { getTemplate } from "../templates/index.js";

export const templatesRouter = Router();

templatesRouter.get("/:key", requireAuth, validate(templateParamsSchema, "params"), (req, res) => {
  // Express types params as string | string[]. validate() has already checked it is a string.
  const { key } = req.params as z.infer<typeof templateParamsSchema>;
  const template = getTemplate(key);
  if (!template) {
    throw new HttpError(404, "Template not found");
  }
  res.json(template);
});
