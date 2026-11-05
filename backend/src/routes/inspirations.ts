import express, { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { HttpError } from "../middleware/errorHandler.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import { createInspirationSchema, inspirationIdSchema, updateInspirationSchema } from "../schemas/inspirations.js";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../services/imageFiles.js";
import {
  createInspiration,
  deleteInspiration,
  listInspirations,
  setInspirationImage,
  updateInspiration,
} from "../services/inspirations.js";

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

// The request body is the image file itself (for example Content-Type: image/png).
// express.raw() only reads bodies of the allowed types, and rejects files over the size limit.
// If the type is not allowed, the body is not read and req.body is not a Buffer.
inspirationsRouter.put(
  "/:id/image",
  validate(inspirationIdSchema, "params"),
  express.raw({ type: ALLOWED_IMAGE_TYPES, limit: MAX_IMAGE_BYTES }),
  async (req, res) => {
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
      throw new HttpError(400, "Send the image as the request body with Content-Type image/jpeg, image/png or image/webp");
    }
    const { id } = req.params as z.infer<typeof inspirationIdSchema>;
    res.json(await setInspirationImage(id, req.userId!, req.body));
  },
);

inspirationsRouter.delete("/:id", validate(inspirationIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof inspirationIdSchema>;
  await deleteInspiration(id, req.userId!);
  res.status(204).end();
});
