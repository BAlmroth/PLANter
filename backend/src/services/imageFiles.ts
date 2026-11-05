// Image types we accept (SVG is left out on purpose: it can contain scripts)
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

type ImageKind = { contentType: string; extension: string };

// Looks at the first bytes of the file ("magic bytes") to find out what it really is.
// The Content-Type header is written by the client, so it can lie. The bytes cannot.
// Returns null if the file is not a JPEG, PNG or WebP.
export function detectImageKind(file: Buffer): ImageKind | null {
  // JPEG starts with FF D8 FF
  if (file.length >= 3 && file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  // PNG starts with 89 "PNG" (89 50 4E 47)
  if (file.length >= 4 && file.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return { contentType: "image/png", extension: "png" };
  }
  // WebP is "RIFF" + 4 size bytes + "WEBP"
  if (file.length >= 12 && file.toString("ascii", 0, 4) === "RIFF" && file.toString("ascii", 8, 12) === "WEBP") {
    return { contentType: "image/webp", extension: "webp" };
  }
  return null;
}
