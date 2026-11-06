import { z } from "zod";

// :itemId and :colorId in /api/items/:itemId/colors/:colorId
export const itemColorParamSchema = z.object({ itemId: z.uuid(), colorId: z.uuid() });
