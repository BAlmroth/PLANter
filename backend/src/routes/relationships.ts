import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/items.js";
import { createRelationshipSchema, relationshipIdSchema } from "../schemas/relationships.js";
import {
  createRelationship,
  deleteRelationship,
  listRelationships,
} from "../services/relationships.js";

// List: /api/projects/:projectId/relationships
export const projectRelationshipsRouter = Router({ mergeParams: true });
projectRelationshipsRouter.use(requireAuth);

projectRelationshipsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listRelationships(projectId, req.userId!));
});

// Create and delete: /api/relationships. The project is found through the items, not the URL.
export const relationshipsRouter = Router();
relationshipsRouter.use(requireAuth);

relationshipsRouter.post("/", validate(createRelationshipSchema), async (req, res) => {
  res.status(201).json(await createRelationship(req.userId!, req.body));
});

relationshipsRouter.delete("/:id", validate(relationshipIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof relationshipIdSchema>;
  await deleteRelationship(id, req.userId!);
  res.status(204).end();
});
