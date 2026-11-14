import { useState, type FormEvent } from "react";
import styles from "../items/ItemDetail.module.css";

type Props = {
  // The saved text. null or "" = none.
  conditions: string | null | undefined;
  busy: boolean;
  // Saves the text ("" clears it). Returns an error message, or null when it worked.
  onSave: (conditions: string) => Promise<string | null>;
};

// The "Conditions" row of the Requirements card: requirements that are not items in the plan,
// like "Only in summer" or "Player level 5". Anything that IS an item (a quest, a key) should be
// an "unlocked by" connection instead, so it shows on the map and gets the loop check.
// The text is rendered as plain text (React escapes it), never as HTML.
export function ConditionsEditor({ conditions, busy, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const saved = conditions ?? "";

  function startEditing() {
    setText(saved);
    setError(null);
    setEditing(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const message = await onSave(text.trim());
    setSaving(false);
    if (message === null) setEditing(false);
    else setError(message);
  }

  if (editing) {
    return (
      <form onSubmit={handleSubmit}>
        <label>
          When is it available?
          <textarea
            rows={3}
            maxLength={500}
            placeholder="For example: only in summer, from player level 5"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </label>
        {error && <p role="alert">{error}</p>}
        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>{" "}
        <button type="button" onClick={() => setEditing(false)}>
          Cancel
        </button>
      </form>
    );
  }

  return (
    <>
      {saved === "" ? (
        <p className={styles.empty}>None yet.</p>
      ) : (
        <p className={styles.description}>{saved}</p>
      )}
      <p>
        <button type="button" className={styles.secondary} onClick={startEditing} disabled={busy}>
          {saved === "" ? "+ Add" : "Edit"}
        </button>
      </p>
    </>
  );
}
