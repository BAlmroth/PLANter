import type { RequestHandler } from "express";
import { z } from "zod";
import { HttpError } from "./errorHandler.js";

// Takes a Zod schema and returns a middleware that checks part of the request against it:
// the body (default) or the URL params (like :id). Query strings can be added later.
// Invalid input stops here with a 400. Valid input continues, and the checked part is replaced
// with the parsed result, so unknown fields (like a made-up userId) are removed.
export const validate = (schema: z.ZodType, source: "body" | "params" = "body"): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      // flattenError turns the issues into { formErrors, fieldErrors: { name: ["..."] } }
      throw new HttpError(400, `Invalid request ${source}`, z.flattenError(result.error));
    }

    req[source] = result.data;
    next();
  };
};
