import { useState } from "react";
import { ApiError } from "../../lib/api";
import { IMAGE_TYPES, imageProblem } from "../../lib/imageFile";
import { isHttpUrl } from "../projects/isHttpUrl";
import { uploadItemImage } from "./itemsApi";
import type { Item } from "./types";
import styles from "./ItemPhoto.module.css";

// The main photo of an item (for example a Figma screenshot), with upload and replace.
// The photo is saved as soon as a file is chosen.
export function ItemPhoto({ item, onChange }: { item: Item; onChange: (updated: Item) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const problem = imageProblem(file);
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    setBusy(true);
    try {
      onChange(await uploadItemImage(item.id, file));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.photo}>
      {/* imageUrl is a link made by our backend, and is still only used when it is http(s) */}
      {item.imageUrl && isHttpUrl(item.imageUrl) && <img src={item.imageUrl} alt={item.title} className={styles.image} />}
      <label className={styles.upload}>
        {busy ? "Uploading…" : item.imageUrl ? "Replace photo" : "Add photo"}
        <input type="file" accept={IMAGE_TYPES.join(",")} disabled={busy} onChange={(e) => void handleFile(e.target.files?.[0])} />
      </label>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
