import { useState } from "react";
import { ApiError } from "../../lib/api";
import { deleteItem, updateItem } from "./itemsApi";
import { ItemForm } from "./ItemForm";
import { ConnectExistingForm } from "../relationships/ConnectExistingForm";
import { ConnectedItemForm } from "../relationships/ConnectedItemForm";
import type { ConnectOption, Connection } from "../relationships/connections";
import type { Item, ItemStatus, UpdateItemInput } from "./types";

//add confirmation for 409 "this edit will delete/affect this"
type Props = {
  item: Item;
  connections: Connection[];
  // What can be added and connected from this item, and how to do it (returns an error message or null)
  connectOptions: ConnectOption[];
  onAddConnected: (option: ConnectOption, title: string) => Promise<string | null>;
  // The other items in the project, to connect to
  otherItems: Item[];
  onConnectExisting: (option: ConnectOption, otherItemId: string) => Promise<string | null>;
  onDeleteConnection: (relationshipId: string) => Promise<string | null>;
  // Called with the item as the server saved it, or with the id of a deleted item
  onUpdated: (item: Item) => void;
  onDeleted: (id: string) => void;
};

export function ItemRow({
  item,
  connections,
  connectOptions,
  onAddConnected,
  otherItems,
  onConnectExisting,
  onDeleteConnection,
  onUpdated,
  onDeleted,
}: Props) {
  // true while the edit form is open
  const [editing, setEditing] = useState(false);
  // Which connect form is open: a new item, an existing item, or none
  const [connecting, setConnecting] = useState<"new" | "existing" | null>(null);
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
    // TODO when tasks exist: add the number of tasks
    const count = connections.length;
    const alsoDeletes = count === 0 ? "its tasks" : `${count} ${count === 1 ? "connection" : "connections"} and its tasks`;
    if (!window.confirm(`Delete "${item.title}"? This also deletes ${alsoDeletes}.`)) {
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

  async function handleDeleteConnection(connection: Connection) {
    if (!window.confirm(`Remove the connection "${connection.label}: ${connection.otherTitle}"?`)) return;
    setError(null);
    setBusy(true);
    const message = await onDeleteConnection(connection.id);
    // On success the connection disappears from the list, so only a failure needs to be shown
    if (message !== null) setError(message);
    setBusy(false);
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
      {connections.length > 0 && (
        <ul>
          {connections.map((connection) => (
            <li key={connection.id}>
              {connection.label}: {connection.otherTitle} ({connection.otherTypeLabel}){" "}
              <button type="button" onClick={() => handleDeleteConnection(connection)} disabled={busy}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
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
      {connectOptions.length > 0 &&
        (connecting === "new" ? (
          <ConnectedItemForm
            thisTitle={item.title}
            options={connectOptions}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, title) => {
              const message = await onAddConnected(option, title);
              if (message === null) setConnecting(null);
              return message;
            }}
          />
        ) : connecting === "existing" ? (
          <ConnectExistingForm
            thisTitle={item.title}
            options={connectOptions}
            items={otherItems}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, otherItemId) => {
              const message = await onConnectExisting(option, otherItemId);
              if (message === null) setConnecting(null);
              return message;
            }}
          />
        ) : (
          <>
            <button type="button" onClick={() => setConnecting("new")} disabled={busy}>
              Add connected item
            </button>{" "}
            <button type="button" onClick={() => setConnecting("existing")} disabled={busy}>
              Connect existing item
            </button>
          </>
        ))}
      {error && <p role="alert">{error}</p>}
    </li>
  );
}
