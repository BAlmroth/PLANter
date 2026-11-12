import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import type { MoodboardColor } from "./MoodboardCard";
import styles from "./MoodboardCard.module.css";

type Props = {
  // Palette colors this item does not use yet
  unused: MoodboardColor[];
  onLink: (colorId: string) => Promise<void>;
  // Creates the color in the project's palette and links it to the item
  onCreate: (input: { hex: string; name?: string }) => Promise<void>;
};

const messageFrom = (err: unknown) => (err instanceof ApiError || err instanceof Error ? err.message : "Something went wrong.");

// The color form of an item: pick a color from the palette, or make a new one.
// Used in the colorForm slot of MoodboardCard.
export function ItemColorForm({ unused, onLink, onCreate }: Props) {
  const [colorId, setColorId] = useState("");
  // The browser's color picker always gives "#rrggbb", which the backend accepts
  const [hex, setHex] = useState("#3e6554");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  function handleLink(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await onLink(colorId);
      setColorId("");
    });
  }

  function handleCreate(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      await onCreate({ hex, ...(name.trim() && { name: name.trim() }) });
      setName("");
    });
  }

  return (
    <div className={styles.form}>
      {unused.length > 0 && (
        <form onSubmit={handleLink} className={styles.formButtons}>
          <select value={colorId} onChange={(e) => setColorId(e.target.value)} aria-label="Color from the palette" required>
            <option value="">Add from the palette…</option>
            {unused.map((color) => (
              <option key={color.id} value={color.id}>
                {color.name ? `${color.name} (${color.hex})` : color.hex}
              </option>
            ))}
          </select>
          <button type="submit" disabled={busy || colorId === ""}>
            Add
          </button>
        </form>
      )}
      <form onSubmit={handleCreate} className={styles.formButtons}>
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="New color" />
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Color name" maxLength={100} />
        <button type="submit" disabled={busy}>
          New color
        </button>
      </form>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
