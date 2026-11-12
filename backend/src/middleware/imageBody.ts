import express from "express";
import type { RequestHandler } from "express";
import { imageFileSchema } from "../schemas/images.js";
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "../services/imageFiles.js";
import { validate } from "./validate.js";

// express.raw() only reads bodies of the allowed types, and rejects files over the size limit
const readRawBody = express.raw({ type: ALLOWED_IMAGE_TYPES, limit: MAX_IMAGE_BYTES });
const checkImageFile = validate(imageFileSchema);

// For routes where the request body is the image file itself (for example Content-Type: image/png).
// First the body is read as a Buffer, then Zod checks that it really is an image (400 if not).
export const imageBody: RequestHandler = (req, res, next) => {
  readRawBody(req, res, (err?: unknown) => {
    if (err) return next(err);
    try {
      checkImageFile(req, res, next);
    } catch (error) {
      next(error); // validate() throws an HttpError (400)
    }
  });
};
