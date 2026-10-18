import type { RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "./errorHandler.js";

// Takes a Zod schema and returns a middleware that checks req.body against it.
// Invalid input stops here with a 400. Valid input continues, and req.body is replaced
// with the parsed result, so unknown fields (like a made-up userId) are removed.
export const validate = (schema: z.ZodType): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      // flattenError turns the issues into { formErrors, fieldErrors: { name: ["..."] } }
      throw new HttpError(400, "Invalid request body", z.flattenError(result.error));
    }

    req.body = result.data;
    next();
  };
};
