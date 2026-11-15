import { useState } from "react";
import { Dropdown } from "../../components/Dropdown";
import type { Item, Template } from "../items/types";
import { getAllowedRelationshipTypes } from "../relationships/connections";
import { parseQuantity } from "../relationships/quantity";
import { QuantityField } from "../relationships/QuantityField";

type Props = {
  // The item the arrow was dragged from, and the item it was dropped on
  source: Item;
  target: Item;
  template: Template;
  // Returns an error message, or null when it worked (the parent then closes the prompt)
  // quantity: only for a type with hasQuantity, undefined when the field is empty
  onSubmit: (relationshipType: string, quantity: number | undefined) => Promise<string | null>;
  onCancel: () => void;
};

// Shown after an arrow is dragged between two nodes: pick one of the relationship types
// that the template allows for these two item types.
export function ConnectionPrompt({ source, target, template, onSubmit, onCancel }: Props) {
  const types = getAllowedRelationshipTypes(source.type, target.type, template);
  // "" means "not chosen yet", the first type is used
  const [typeKey, setTypeKey] = useState("");
  const [quantityText, setQuantityText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const selected = types.find((type) => type.key === typeKey) ?? types[0];

  async function handleSubmit() {
    if (!selected) return;
    setError(null);
    // The amount only counts when the chosen type can have one
    const quantity = selected.hasQuantity ? parseQuantity(quantityText) : { value: undefined };
    if ("error" in quantity) {
      setError(quantity.error);
      return;
    }
    setSubmitting(true);
    const message = await onSubmit(selected.key, quantity.value);
    if (message !== null) {
      setError(message);
      setSubmitting(false);
    }
  }

  return (
    // A fragment, not a <div>: the parts become children of the box the map puts this in,
    // so the box can lay them out on one line
    <>
      {selected ? (
        // A <div>, not a <p>: the Dropdown is a <div>, and HTML does not allow a <div> inside a <p>
        <div>
          {source.title}{" "}
          <Dropdown
            label="Connection type"
            value={selected.key}
            options={types.map((type) => ({ value: type.key, label: type.label }))}
            onChange={setTypeKey}
            inline
            openUp
          />{" "}
          {target.title}
        </div>
      ) : (
        <p>
          “{source.title}” cannot be connected to “{target.title}”.
        </p>
      )}
      {selected?.hasQuantity && <QuantityField value={quantityText} onChange={setQuantityText} />}
      {error && <p role="alert">{error}</p>}
      {selected && (
        <button type="button" onClick={handleSubmit} disabled={submitting}>
          {submitting ? "Please wait…" : "Connect"}
        </button>
      )}{" "}
      <button type="button" onClick={onCancel}>
        Cancel
      </button>
    </>
  );
}
