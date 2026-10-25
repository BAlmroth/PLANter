import { useState } from "react";
import { ApiError } from "../../lib/api";
import { deleteItem, updateItem } from "./itemsApi";
import { ItemForm } from "./itemForm";
import type { Item, ItemStatus, UpdateItemInput } from "./types";

type Props = {
  item: Item;
  // Called with the item as the server saved it, or with the id of a deleted item
  onUpdated: (item: Item) => void;
  onDeleted: (id: string) => void;
};

export function ItemRow({ item, onUpdated, onDeleted }: Props) {
  // true while the edit form is open
  const [editing, setEditing] = useState(false);
  // true while a request from a checkbox or the delete button is running
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sends the changed fields and shows the saved item. Used by the checkboxes.
  async function save(changes: UpdateItemInput) {
    setError(null);
    setBusy(true);
    try {
      onUpdated(await updateItem(item.id, changes));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  // Two checkboxes cover three statuses: neither checked means "planned".
  // Unchecking the one that is checked goes back to "planned".
  function setStatus(status: ItemStatus, checked: boolean) {
    return save({ status: checked ? status : "planned" });
  }

  async function handleDelete() {
    // TODO sprint 3: say how many connections and tasks are deleted too
    if (!window.confirm(`Delete "${item.title}"? This also deletes its connections and tasks.`)) {
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await deleteItem(item.id);
      onDeleted(item.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong.");
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <li>
        <ItemForm
          initialValues={{
            title: item.title,
            description: item.description ?? "",
            isMvp: item.isMvp,
          }}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async ({ title, description, isMvp }) => {
            try {
              // "" clears the description, like for projects
              onUpdated(await updateItem(item.id, { title, description, isMvp }));
              setEditing(false);
              return null;
            } catch (err) {
              return err instanceof ApiError ? err.message : "Something went wrong.";
            }
          }}
        />
      </li>
    );
  }

  return (
    <li>
      <h3>{item.title}</h3>
      {item.isMvp && <p>MVP</p>}
      {item.description && <p>{item.description}</p>}
      <label>
        <input
          type="checkbox"
          checked={item.status === "in_progress"}
          disabled={busy}
          onChange={(e) => setStatus("in_progress", e.target.checked)}
        />
        In progress
      </label>{" "}
      <label>
        <input
          type="checkbox"
          checked={item.status === "done"}
          disabled={busy}
          onChange={(e) => setStatus("done", e.target.checked)}
        />
        Done
      </label>{" "}
      <button type="button" onClick={() => setEditing(true)} disabled={busy}>
        Edit
      </button>{" "}
      <button type="button" onClick={handleDelete} disabled={busy}>
        Delete
      </button>
      {error && <p role="alert">{error}</p>}
    </li>
  );
}
