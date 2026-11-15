import { useState, type FormEvent } from "react";
import { Dropdown } from "../../components/Dropdown";
import { GroupChip } from "../groups/GroupChip";
import type { Group } from "../groups/types";
import styles from "./ItemForm.module.css";

// groupIds: the ticked groups (always [] when the form shows no groups)
export type ItemFormValues = { title: string; description: string; type: string; isMvp: boolean; groupIds: string[] };

type Props = {
  initialValues?: Partial<ItemFormValues>;
  // When given, the form shows a type dropdown, with the chosen type's help text under it
  types?: { key: string; label: string; description: string; example: string }[];
  // Shows the MVP checkbox (used when editing)
  showMvp?: boolean;
  // When given (and not empty), the form shows a checkbox per group
  groups?: Group[];
  submitLabel: string;
  onSubmit: (values: ItemFormValues) => Promise<string | null>;
  onCancel: () => void;
};

// Title + description (+ type and MVP checkbox when asked for) form for an item, used inline on the File view.
export function ItemForm({
  initialValues = {},
  types,
  showMvp = false,
  groups = [],
  submitLabel,
  onSubmit,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initialValues.title ?? "");
  const [description, setDescription] = useState(initialValues.description ?? "");
  const [isMvp, setIsMvp] = useState(initialValues.isMvp ?? false);
  const [groupIds, setGroupIds] = useState(initialValues.groupIds ?? []);
  // Starts on the first type in the list, or on the item's own type when editing
  const [type, setType] = useState(initialValues.type ?? types?.[0]?.key ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The chosen type, for its help text (undefined when there is no dropdown or the type is unknown)
  const selectedType = types?.find((t) => t.key === type);

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
    const message = await onSubmit({ title, description, type, isMvp, groupIds });
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
          <Dropdown
            label="Type"
            value={type}
            options={types.map((t) => ({ value: t.key, label: t.label }))}
            onChange={setType}
            block
          />
        </label>
      )}
      {/* Changes with the dropdown, so the user sees what the category means before choosing it */}
      {selectedType && <p>{selectedType.description}</p>}
      <label>
        Title
        <input
          type="text"
          required
          maxLength={100}
          placeholder={selectedType ? `e.g. ${selectedType.example}` : undefined}
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
      {groups.length > 0 && (
        <fieldset className={styles.groups}>
          <legend>Groups (optional)</legend>
          {groups.map((group) => (
            <label key={group.id} className={styles.group}>
              <input
                type="checkbox"
                checked={groupIds.includes(group.id)}
                onChange={(e) =>
                  setGroupIds((current) =>
                    e.target.checked ? [...current, group.id] : current.filter((id) => id !== group.id),
                  )
                }
              />
              <GroupChip group={group} />
            </label>
          ))}
        </fieldset>
      )}
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