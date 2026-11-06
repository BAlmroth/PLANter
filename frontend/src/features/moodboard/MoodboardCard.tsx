import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../lib/api";
import { IMAGE_TYPES, imageProblem } from "../../lib/imageFile";
import { isHexColor } from "../colors/isHexColor";
import { isHttpUrl } from "../projects/isHttpUrl";
import styles from "./MoodboardCard.module.css";

// What the card needs to show. Item details and project inspirations both fit these shapes.
export type MoodboardEntry = { id: string; title: string; url: string | null; text: string | null; imageUrl: string | null };
export type MoodboardColor = { id: string; hex: string; name: string | null };
export type NewEntry = { title: string; url?: string; text?: string };

type Props = {
  heading: string;
  entries: MoodboardEntry[];
  colors: MoodboardColor[];
  // The parent talks to the API and updates its lists. A thrown error is shown in the card.
  onAddEntry: (input: NewEntry, image: File | null) => Promise<void>;
  onDeleteEntry: (id: string) => Promise<void>;
  onRemoveColor: (id: string) => Promise<void>;
  // The form for adding a color. It differs per page (an item picks from the palette, the project adds to it).
  colorForm: ReactNode;
};

const messageFrom = (err: unknown) =>
  err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong.";

// The inspiration and moodboard card: links with notes, a color palette, and visual references (images).
// Used for one item, and for the whole project. Add and delete buttons are inside the card.
export function MoodboardCard({ heading, entries, colors, onAddEntry, onDeleteEntry, onRemoveColor, colorForm }: Props) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  // A file input cannot be cleared from React, so changing its key makes a fresh one
  const [fileInputKey, setFileInputKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // An entry with an image is a visual reference. All the others are links and notes.
  const links = entries.filter((entry) => !entry.imageUrl);
  const references = entries.filter((entry) => entry.imageUrl);

  // Runs one action from a button: shows the error, and disables the buttons while it runs
  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  function pickImage(file: File | undefined) {
    const problem = file ? imageProblem(file) : null;
    if (problem) {
      setError(problem);
      setFileInputKey((key) => key + 1);
      setImage(null);
      return;
    }
    setError(null);
    setImage(file ?? null);
  }

  function handleAdd(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      // Empty fields are left out of the request
      await onAddEntry({ title, ...(url.trim() && { url: url.trim() }), ...(text.trim() && { text }) }, image);
      setTitle("");
      setUrl("");
      setText("");
      setImage(null);
      setFileInputKey((key) => key + 1);
      setAdding(false);
    });
  }

  // The title is a link only when the url is http(s). Everything else is shown as plain text.
  const label = (entry: MoodboardEntry) =>
    entry.url && isHttpUrl(entry.url) ? (
      <a href={entry.url} target="_blank" rel="noopener noreferrer">
        {entry.title}
      </a>
    ) : (
      entry.title
    );

  return (
    <section className={styles.card}>
      <h2 className={styles.heading}>{heading}</h2>

      {links.length > 0 && (
        <ul className={styles.links}>
          {links.map((entry) => (
            <li key={entry.id} className={styles.link}>
              <span className={styles.linkTitle}>{label(entry)}</span>
              {entry.text && <span className={styles.note}>{entry.text}</span>}
              <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onDeleteEntry(entry.id))} aria-label={`Delete ${entry.title}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3 className={styles.label}>Color palette</h3>
      {colors.length > 0 && (
        <ul className={styles.swatches}>
          {colors.map((color) => (
            <li key={color.id} className={styles.swatch} title={color.name ?? undefined}>
              {/* The color only reaches the style attribute when it is a valid #RRGGBB */}
              <span className={styles.chip} style={isHexColor(color.hex) ? { background: color.hex } : undefined} />
              <span className={styles.hex}>{color.hex}</span>
              <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onRemoveColor(color.id))} aria-label={`Remove ${color.hex}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      {colorForm}

      {references.length > 0 && (
        <>
          <h3 className={styles.label}>Visual references</h3>
          <ul className={styles.references}>
            {references.map((entry) => (
              <li key={entry.id} className={styles.reference}>
                {/* imageUrl is a link made by our backend, and is still only used when it is http(s) */}
                {entry.imageUrl && isHttpUrl(entry.imageUrl) && <img src={entry.imageUrl} alt={entry.title} className={styles.image} />}
                <div className={styles.caption}>
                  <strong>{label(entry)}</strong>
                  {/* Rendered as text only (React escapes it) */}
                  {entry.text && <span className={styles.note}>{entry.text}</span>}
                </div>
                <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onDeleteEntry(entry.id))} aria-label={`Delete ${entry.title}`}>
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {adding ? (
        <form onSubmit={handleAdd} className={styles.form}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" required maxLength={100} />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Short description (optional)" aria-label="Description" maxLength={2000} rows={2} />
          <input key={fileInputKey} type="file" accept={IMAGE_TYPES.join(",")} onChange={(e) => pickImage(e.target.files?.[0])} aria-label="Image" />
          <div className={styles.formButtons}>
            <button type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setAdding(false)} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button type="button" className={styles.secondary} onClick={() => setAdding(true)}>
          + Add link or image
        </button>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </section>
  );
}
