import { useState, type FormEvent } from "react";
import { Dropdown } from "../../components/Dropdown";
import type { Item } from "../items/types";
import { getTypeChoices, type ConnectOption } from "./connections";

type Props = {
  // The title of the item the form is opened on
  thisTitle: string;
  options: ConnectOption[];
  // The other items in the project (not this one)
  items: Item[];
  // Returns an error message, or null when it worked (the parent then closes the form)
  onSubmit: (option: ConnectOption, otherItemId: string) => Promise<string | null>;
  onCancel: () => void;
};

// Like ConnectedItemForm, but you pick an item that already exists instead of typing a title.
// Read as a sentence from the other item's side: "Button (Component) belongs to About (Page)".
export function ConnectExistingForm({ thisTitle, options, items, onSubmit, onCancel }: Props) {
  const typeChoices = getTypeChoices(options);
  const [type, setType] = useState(typeChoices[0]?.newItemType ?? "");
  // "" means "not chosen yet", the first choice is used (same idea as in ConnectedItemForm)
  const [itemId, setItemId] = useState("");
  const [optionKey, setOptionKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const itemChoices = items.filter((item) => item.type === type);
  const selectedItem = itemChoices.find((item) => item.id === itemId) ?? itemChoices[0];
  const verbChoices = options.filter((option) => option.newItemType === type);
  const selected = verbChoices.find((option) => option.key === optionKey) ?? verbChoices[0];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!selected || !selectedItem) return;

    setSubmitting(true);
    const message = await onSubmit(selected, selectedItem.id);
    if (message !== null) {
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        What type of item?
        <Dropdown
          label="What type of item?"
          value={type}
          options={typeChoices.map((option) => ({ value: option.newItemType, label: option.newItemTypeLabel }))}
          onChange={(value) => {
            setType(value);
            setItemId("");
            setOptionKey("");
          }}
          block
        />
      </label>
      {itemChoices.length === 0 ? (
        <p>No other {selected?.newItemTypeLabel ?? "such"} items in this project yet.</p>
      ) : (
        <label>
          Which one?
          <Dropdown
            label="Which one?"
            value={selectedItem?.id ?? ""}
            options={itemChoices.map((item) => ({ value: item.id, label: item.title }))}
            onChange={setItemId}
            block
          />
        </label>
      )}
      <label>
        How is it connected to “{thisTitle}”?
        <Dropdown
          label="How is it connected"
          value={selected?.key ?? ""}
          options={verbChoices.map((option) => ({ value: option.key, label: option.verb }))}
          onChange={setOptionKey}
          block
        />
      </label>
      {selected && selectedItem && (
        <p>
          {selectedItem.title} ({selected.newItemTypeLabel}) <strong>{selected.verb}</strong>{" "}
          {thisTitle} ({selected.thisItemTypeLabel})
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting || !selectedItem}>
        {submitting ? "Please wait…" : "Connect"}
      </button>{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
