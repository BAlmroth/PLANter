import { useState, type FormEvent } from "react";
import { parseQuantity } from "../relationships/quantity";
import { QuantityField } from "../relationships/QuantityField";

type Props = {
  // The amount now, null = none
  current: number | null;
  // Sends the new amount (null removes it). Returns an error message, or null when it worked.
  onSave: (quantity: number | null) => Promise<string | null>;
  onCancel: () => void;
};

// Changes the amount of one requirement in place, for example "20 × Wood" to 25.
// An empty field removes the amount (PATCH with null). Only shown for types with hasQuantity.
export function AmountEditor({ current, onSave, onCancel }: Props) {
  const [text, setText] = useState(current === null ? "" : String(current));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseQuantity(text);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    setError(null);
    setSaving(true);
    const message = await onSave(parsed.value ?? null);
    // On success the parent closes the editor, so only a failure needs handling here
    if (message !== null) {
      setError(message);
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <QuantityField value={text} onChange={setText} />
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={saving}>
        {saving ? "Saving…" : "Save"}
      </button>{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
