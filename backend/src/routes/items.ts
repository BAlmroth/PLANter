import { Router } from "express";
import type { z } from "zod";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createItemSchema,
  itemIdSchema,
  projectIdParamSchema,
  updateItemSchema,
} from "../schemas/items.js";
import {
  createItem,
  deleteItem,
  getOwnedItem,
  listItems,
  updateItem,
} from "../services/items.js";

// Items are created and listed inside a project: /api/projects/:projectId/items
// mergeParams makes :projectId, which is in the path where this router is mounted, visible here.
export const projectItemsRouter = Router({ mergeParams: true });
projectItemsRouter.use(requireAuth);

// List the items of a project
projectItemsRouter.get("/", validate(projectIdParamSchema, "params"), async (req, res) => {
  const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
  res.json(await listItems(projectId, req.userId!));
});

// Create an item in a project
projectItemsRouter.post(
  "/",
  validate(projectIdParamSchema, "params"),
  validate(createItemSchema),
  async (req, res) => {
    const { projectId } = req.params as z.infer<typeof projectIdParamSchema>;
    const item = await createItem(projectId, req.userId!, req.body);
    res.status(201).json(item);
  },
);

// One item is identified by its id alone: /api/items/:id
export const itemsRouter = Router();
itemsRouter.use(requireAuth);

// Get one item
itemsRouter.get("/:id", validate(itemIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof itemIdSchema>;
  res.json(await getOwnedItem(id, req.userId!));
});

// Update title, type, description, status and/or MVP flag
itemsRouter.patch(
  "/:id",
  validate(itemIdSchema, "params"),
  validate(updateItemSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof itemIdSchema>;
    res.json(await updateItem(id, req.userId!, req.body));
  },
);

// Delete an item (its relationships and tasks are deleted with it)
itemsRouter.delete("/:id", validate(itemIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof itemIdSchema>;
  await deleteItem(id, req.userId!);
  res.status(204).end();
});
