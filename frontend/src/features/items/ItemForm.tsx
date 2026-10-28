import { useState, type FormEvent } from "react";

export type ItemFormValues = { title: string; description: string; type: string; isMvp: boolean };

type Props = {
  initialValues?: Partial<ItemFormValues>;
  // When given, the form shows a type dropdown
  types?: { key: string; label: string }[];
  // Shows the MVP checkbox (used when editing)
  showMvp?: boolean;
  submitLabel: string;
  onSubmit: (values: ItemFormValues) => Promise<string | null>;
  onCancel: () => void;
};

// Title + description (+ type and MVP checkbox when asked for) form for an item, used inline on the File view.
export function ItemForm({
  initialValues = {},
  types,
  showMvp = false,
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [isMvp, setIsMvp] = useState(initialValues.isMvp ?? false);
  // Starts on the first type in the list, or on the item's own type when editing
  const [type, setType] = useState(initialValues.type ?? types?.[0]?.key ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    // onSubmit returns an error message, or null when it worked.
    // On success the parent closes the form, so we only update our state on failure.
    const message = await onSubmit({ title, description, type, isMvp });
    if (message !== null) {
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {types && (
        <label>
          Type
          <select value={type} onChange={(e) => setType(e.target.value)}>
            {types.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        Title
        <input
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        Description (optional)
        <textarea
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      {showMvp && (
        <label>
          <input type="checkbox" checked={isMvp} onChange={(e) => setIsMvp(e.target.checked)} />
          MVP
        </label>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Please wait…" : submitLabel}
      </button>{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}