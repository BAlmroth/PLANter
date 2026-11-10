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

// What the card shows: only the content (null), the two edit choices ("menu"),
// the color form ("color"), or the form for a link, text or image ("entry").
type Mode = null | "menu" | "color" | "entry";

// A pencil, drawn with currentColor so it takes the button's text color
function EditIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <path
        d="M11 2.5 L13.5 5 L5.5 13 L2.5 13.5 L3 10.5 Z M9.5 4 L12 6.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// The inspiration and moodboard card: links with notes, a color palette, and visual references (images).
// Normally it only shows the content. The edit button in the header opens the edit mode: two choices
// (add a color, add a link/text/image), and the delete buttons on every entry and color.
export function MoodboardCard({ heading, entries, colors, onAddEntry, onDeleteEntry, onRemoveColor, colorForm }: Props) {
  const [mode, setMode] = useState<Mode>(null);
  const editing = mode !== null;
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
      // Back to the two choices, so it is easy to add one more
      setMode("menu");
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
      <div className={styles.header}>
        <h2 className={styles.heading}>{heading}</h2>
        <button
          type="button"
          className={editing ? `${styles.editButton} ${styles.active}` : styles.editButton}
          onClick={() => {
            setMode(editing ? null : "menu");
            setError(null);
          }}
          aria-label={editing ? `Stop editing ${heading}` : `Edit ${heading}`}
          aria-pressed={editing}
          title={editing ? "Done" : "Edit"}
        >
          <EditIcon />
        </button>
      </div>

      {/* The two choices, and the form of the chosen one */}
      {mode === "menu" && (
        <div className={styles.menu}>
          <button type="button" className={styles.secondary} onClick={() => setMode("color")}>
            + Color
          </button>
          <button type="button" className={styles.secondary} onClick={() => setMode("entry")}>
            + Link, text or image
          </button>
        </div>
      )}
      {mode === "color" && (
        <div className={styles.editBox}>
          {colorForm}
          <button type="button" className={styles.secondary} onClick={() => setMode("menu")}>
            Back
          </button>
        </div>
      )}
      {mode === "entry" && (
        <form onSubmit={handleAdd} className={`${styles.form} ${styles.editBox}`}>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" required maxLength={100} />
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Short description (optional)" aria-label="Description" maxLength={2000} rows={2} />
          <input key={fileInputKey} type="file" accept={IMAGE_TYPES.join(",")} onChange={(e) => pickImage(e.target.files?.[0])} aria-label="Image" />
          <div className={styles.formButtons}>
            <button type="submit" disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </button>
            <button type="button" className={styles.secondary} onClick={() => setMode("menu")} disabled={busy}>
              Back
            </button>
          </div>
        </form>
      )}
      {error && <p role="alert" className={styles.error}>{error}</p>}

      {entries.length === 0 && colors.length === 0 && !editing && (
        <p className={styles.empty}>Nothing here yet. Use the edit button to add colors, links or images.</p>
      )}

      {links.length > 0 && (
        <ul className={styles.links}>
          {links.map((entry) => (
            <li key={entry.id} className={styles.link}>
              <span className={styles.linkTitle}>{label(entry)}</span>
              {entry.text && <span className={styles.note}>{entry.text}</span>}
              {editing && (
                <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onDeleteEntry(entry.id))} aria-label={`Delete ${entry.title}`}>
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {colors.length > 0 && (
        <>
          <h3 className={styles.label}>Color palette</h3>
          <ul className={styles.swatches}>
            {colors.map((color) => (
              <li key={color.id} className={styles.swatch} title={color.name ?? undefined}>
                {/* The color only reaches the style attribute when it is a valid #RRGGBB */}
                <span className={styles.chip} style={isHexColor(color.hex) ? { background: color.hex } : undefined} />
                <span className={styles.hex}>{color.hex}</span>
                {editing && (
                  <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onRemoveColor(color.id))} aria-label={`Remove ${color.hex}`}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}

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
                {editing && (
                  <button type="button" className={styles.remove} disabled={busy} onClick={() => run(() => onDeleteEntry(entry.id))} aria-label={`Delete ${entry.title}`}>
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
