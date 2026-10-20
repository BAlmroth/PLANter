import { z } from "zod";

// The :key in /api/templates/:key
export const templateParamsSchema = z.object({ key: z.string().min(1) });
