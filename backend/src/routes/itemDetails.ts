import { Router } from "express";
import type { z } from "zod";
import { imageBody } from "../middleware/imageBody.js";
import { requireAuth } from "../middleware/requireAuth.js";
import { validate } from "../middleware/validate.js";
import {
  createItemDetailSchema,
  itemDetailIdSchema,
  itemIdParamSchema,
  updateItemDetailSchema,
} from "../schemas/itemDetails.js";
import {
  createItemDetail,
  deleteItemDetail,
  listItemDetails,
  setItemDetailImage,
  updateItemDetail,
} from "../services/itemDetails.js";

// Listed and created inside an item: /api/items/:itemId/details
export const itemDetailsOfItemRouter = Router({ mergeParams: true });
itemDetailsOfItemRouter.use(requireAuth);

itemDetailsOfItemRouter.get("/", validate(itemIdParamSchema, "params"), async (req, res) => {
  const { itemId } = req.params as z.infer<typeof itemIdParamSchema>;
  res.json(await listItemDetails(itemId, req.userId!));
});

itemDetailsOfItemRouter.post(
  "/",
  validate(itemIdParamSchema, "params"),
  validate(createItemDetailSchema),
  async (req, res) => {
    const { itemId } = req.params as z.infer<typeof itemIdParamSchema>;
    res.status(201).json(await createItemDetail(itemId, req.userId!, req.body));
  },
);

// One detail row is identified by its id alone: /api/item-details/:id
export const itemDetailsRouter = Router();
itemDetailsRouter.use(requireAuth);

itemDetailsRouter.patch(
  "/:id",
  validate(itemDetailIdSchema, "params"),
  validate(updateItemDetailSchema),
  async (req, res) => {
    const { id } = req.params as z.infer<typeof itemDetailIdSchema>;
    res.json(await updateItemDetail(id, req.userId!, req.body));
  },
);

// The request body is the image file itself (see imageBody)
itemDetailsRouter.put("/:id/image", validate(itemDetailIdSchema, "params"), imageBody, async (req, res) => {
  const { id } = req.params as z.infer<typeof itemDetailIdSchema>;
  res.json(await setItemDetailImage(id, req.userId!, req.body));
});

itemDetailsRouter.delete("/:id", validate(itemDetailIdSchema, "params"), async (req, res) => {
  const { id } = req.params as z.infer<typeof itemDetailIdSchema>;
  await deleteItemDetail(id, req.userId!);
  res.status(204).end();
});
