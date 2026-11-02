import { useState, type FormEvent } from "react";
import { getTypeChoices, type ConnectOption } from "./connections";

type Props = {
  // The title of the item the form is opened on, used in the labels and the preview
  thisTitle: string;
  options: ConnectOption[];
  // Returns an error message, or null when it worked (the parent then closes the form)
  onSubmit: (option: ConnectOption, title: string) => Promise<string | null>;
  onCancel: () => void;
};

// Small form under an item. Read it as a sentence from the new item's side:
// "<title> (<type>) <verb> <this item> (<its type>)", for example "Button (Component) belongs to About (Page)".
export function ConnectedItemForm({ thisTitle, options, onSubmit, onCancel }: Props) {
  const [title, setTitle] = useState("");
  // The parent only shows this form when there is at least one option
  const [newItemType, setNewItemType] = useState(options[0]?.newItemType ?? "");
  const [optionKey, setOptionKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const typeChoices = getTypeChoices(options);
  // Only the verbs that are allowed for the chosen type. Falls back to the first one
  // when the type was just changed (optionKey then belongs to the old type).
  const verbChoices = options.filter((option) => option.newItemType === newItemType);
  const selected = verbChoices.find((option) => option.key === optionKey) ?? verbChoices[0];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!selected) return;
    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }

    setSubmitting(true);
    const message = await onSubmit(selected, title.trim());
    if (message !== null) {
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Title of the new item
        <input
          type="text"
          required
          maxLength={100}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label>
        What is it?
        <select
          value={newItemType}
          onChange={(e) => {
            setNewItemType(e.target.value);
            setOptionKey("");
          }}
        >
          {typeChoices.map((option) => (
            <option key={option.newItemType} value={option.newItemType}>
              {option.newItemTypeLabel}
            </option>
          ))}
        </select>
      </label>
      <label>
        How is it connected to “{thisTitle}”?
        <select value={selected?.key ?? ""} onChange={(e) => setOptionKey(e.target.value)}>
          {verbChoices.map((option) => (
            <option key={option.key} value={option.key}>
              {option.verb}
            </option>
          ))}
        </select>
      </label>
      {selected && (
        <p>
          {title.trim() || "New item"} ({selected.newItemTypeLabel}) <strong>{selected.verb}</strong>{" "}
          {thisTitle} ({selected.thisItemTypeLabel})
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? "Please wait…" : "Add and connect"}
      </button>{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
