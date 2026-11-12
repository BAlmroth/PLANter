export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB, the backend checks this too

// Quick check in the browser so the user gets an answer before uploading. The backend is the real check.
export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Image must be a JPEG, PNG or WebP file.";
  if (file.size > MAX_IMAGE_BYTES) return "Image is too large (max 5 MB).";
  return null;
}
