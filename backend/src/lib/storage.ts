import { supabase } from "./supabase.js";

// Thin wrapper around Supabase Storage for inspiration images.
// The bucket is private: nobody can open a file without a signed URL, and only Express
// (using the service role key) can create one, after checking that the user owns the project.
const BUCKET = "inspiration-images";

// A signed URL works for this many seconds, then stops working
const SIGNED_URL_SECONDS = 60 * 60;

// UPLOAD (or replace) a file at the given path
export async function uploadImage(path: string, file: Buffer, contentType: string) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType, upsert: true });
  if (error) throw new Error(`Image upload failed: ${error.message}`);
}

// SIGNED URLS for many paths in one call. Returns a map: path -> temporary URL.
export async function getSignedUrls(paths: string[]) {
  const urls = new Map<string, string>();
  if (paths.length === 0) return urls;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGNED_URL_SECONDS);
  if (error) throw new Error(`Could not create image URLs: ${error.message}`);
  for (const entry of data) {
    if (entry.path && entry.signedUrl) urls.set(entry.path, entry.signedUrl);
  }
  return urls;
}

// DELETE files. Paths that do not exist are ignored by Supabase.
export async function deleteImages(paths: string[]) {
  if (paths.length === 0) return;
  const { error } = await supabase.storage.from(BUCKET).remove(paths);
  if (error) throw new Error(`Image delete failed: ${error.message}`);
}
