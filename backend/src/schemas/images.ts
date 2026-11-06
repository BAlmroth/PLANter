import { z } from "zod";
import { detectImageKind } from "../services/imageFiles.js";

// Zod schema for an uploaded image: the request body is the file itself (a Buffer).
// The size limit (5 MB) and the allowed Content-Types are enforced by express.raw() before this runs.
// If the Content-Type was not allowed, the body was never read and is not a Buffer.
export const imageFileSchema = z
  .instanceof(Buffer, { error: "Send the image as the request body with Content-Type image/jpeg, image/png or image/webp" })
  .refine((file) => file.length > 0, "Image is empty")
  // The first bytes must really be a JPEG, PNG or WebP: the Content-Type header can lie
  .refine((file) => detectImageKind(file) !== null, "File must be a JPEG, PNG or WebP image");
