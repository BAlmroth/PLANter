import { useState } from "react";
import type { Item, Template } from "../items/types";
import { getAllowedRelationshipTypes } from "../relationships/connections";

type Props = {
  // The item the arrow was dragged from, and the item it was dropped on
  source: Item;
  target: Item;
  template: Template;
  // Returns an error message, or null when it worked (the parent then closes the prompt)
  onSubmit: (relationshipType: string) => Promise<string | null>;
  onCancel: () => void;
};

// Shown after an arrow is dragged between two nodes: pick one of the relationship types
// that the template allows for these two item types.
export function ConnectionPrompt({ source, target, template, onSubmit, onCancel }: Props) {
  const types = getAllowedRelationshipTypes(source.type, target.type, template);
  // "" means "not chosen yet", the first type is used
  const [typeKey, setTypeKey] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = types.find((type) => type.key === typeKey) ?? types[0];

  async function handleSubmit() {
    if (!selected) return;
    setError(null);
    setSubmitting(true);
    const message = await onSubmit(selected.key);
    if (message !== null) {
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    <div>
      {selected ? (
        <p>
          {source.title}{" "}
          <select value={selected.key} onChange={(e) => setTypeKey(e.target.value)}>
            {types.map((type) => (
              <option key={type.key} value={type.key}>
                {type.label}
              </option>
            ))}
          </select>{" "}
          {target.title}
        </p>
      ) : (
        <p>
          “{source.title}” cannot be connected to “{target.title}”.
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {selected && (
        <button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Please wait…" : "Connect"}
        </button>
      )}{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
}
