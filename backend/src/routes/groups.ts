import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import { projectIdParamSchema } from "../schemas/projects.js";
import {
  createGroupSchema,
  groupIdSchema,
  groupItemParamsSchema,
  updateGroupSchema,
} from "../schemas/groups.js";
import {
  addItemToGroup,
  createGroup,
  deleteGroup,
  listGroups,
  removeItemFromGroup,
  updateGroup,
} from "../services/groups.js";

// Groups are listed and created inside a project: /api/projects/:projectId/groups
export const projectGroupsRouter = Router({ mergeParams: true });
projectGroupsRouter.use(requireAuth);

projectGroupsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listGroups(projectId, req.userId!));
});

projectGroupsRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createGroupSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    res.status(201).json(await createGroup(projectId, req.userId!, req.body));
  },
);

// One group is identified by its id alone: /api/groups/:id
export const groupsRouter = Router();
groupsRouter.use(requireAuth);

groupsRouter.patch(
  "/:id",
  validate(groupIdSchema, "params"),
  validate(updateGroupSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof groupIdSchema>;
    res.json(await updateGroup(id, req.userId!, req.body));
  },
);

// Delete a group (its items stay)
groupsRouter.delete("/:id", validate(groupIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof groupIdSchema>;
  await deleteGroup(id, req.userId!);
  res.status(204).end();
});

// Put an item in a group. PUT because doing it twice gives the same result.
groupsRouter.put("/:id/items/:itemId", validate(groupItemParamsSchema, "params"), async (req, res) => {
  const { id, itemId } = req.params as z.infer<typeof groupItemParamsSchema>;
  await addItemToGroup(id, itemId, req.userId!);
  res.status(204).end();
});

// Take an item out of a group (the item stays)
groupsRouter.delete("/:id/items/:itemId", validate(groupItemParamsSchema, "params"), async (req, res) => {
  const { id, itemId } = req.params as z.infer<typeof groupItemParamsSchema>;
  await removeItemFromGroup(id, itemId, req.userId!);
  res.status(204).end();
});
