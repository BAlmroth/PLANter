import { randomUUID } from "node:crypto";
import { deleteImages, getSignedUrls, uploadImage } from "../lib/storage.js";
import { HttpError } from "../middleware/errorHandler.js";
import { detectImageKind } from "./imageFiles.js";

// Shared by everything that has an image (inspiration, item main photo, ...).

// CHECK AND UPLOAD an image file. Returns the storage path to save in the database.
// The path is made by us: the client never chooses a file name.
export async function saveImageFile(projectId: string, file: Buffer) {
  const kind = detectImageKind(file);
  if (!kind) throw new HttpError(400, "File must be a JPEG, PNG or WebP image");
  const imagePath = `${projectId}/${randomUUID()}.${kind.extension}`;
  await uploadImage(imagePath, file, kind.contentType);
  return imagePath;
}

// Every response has the same shape: imagePath (the internal storage path) is replaced by imageUrl,
// a temporary link that stops working after an hour. imageUrl is null when there is no image.
export async function withImageUrls<T extends { imagePath: string | null }>(rows: T[]) {
  const urls = await getSignedUrls(rows.flatMap((row) => (row.imagePath ? [row.imagePath] : [])));
  return rows.map(({ imagePath, ...row }) => ({ ...row, imageUrl: imagePath ? (urls.get(imagePath) ?? null) : null }));
}

// The same for a single row
export async function withImageUrl<T extends { imagePath: string | null }>(row: T) {
  return (await withImageUrls([row]))[0];
}

// DELETE the files of rows that are being deleted. Rows without an image are skipped.
export async function deleteImageFiles(rows: { imagePath: string | null }[]) {
  await deleteImages(rows.flatMap((row) => (row.imagePath ? [row.imagePath] : [])));
}
