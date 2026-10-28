import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { ConnectExistingForm } from "../relationships/ConnectExistingForm";
import { ConnectedItemForm } from "../relationships/ConnectedItemForm";
import { getConnectOptions, getConnections, type ConnectOption, type Connection } from "../relationships/connections";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import { ItemForm } from "./ItemForm";
import { createItem, deleteItem, updateItem } from "./itemsApi";
import type { Item, ItemStatus, UpdateItemInput } from "./types";
import { getInvalidRelationshipCount } from "./typeChange";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// The detail view of one item: this is where an item is edited and deleted, and where its
// connections are added and removed. The File view only shows items.
export function ItemDetail({ project, itemId }: { project: Project; itemId: string }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);

  // true while the edit form is open
  const [editing, setEditing] = useState(false);
  // Which connect form is open: a new item, an existing item, or none
  const [connecting, setConnecting] = useState<"new" | "existing" | null>(null);
  // true while a request from a checkbox, a delete button or a remove button is running
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = template.loading || items.loading || relationships.loading;
  const loadError = template.error ?? items.error ?? relationships.error;

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
  }

  if (loading) return <p>Loading item…</p>;

  if (loadError || !template.template) {
    return (
      <div role="alert">
        <p>{loadError ?? "Something went wrong."}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  const item = items.items.find((i) => i.id === itemId);
  if (!item) {
    return (
      <>
        <h1>Item not found</h1>
        <p>
          <Link to={`/projects/${project.id}`}>Back to {project.name}</Link>
        </p>
      </>
    );
  }

  const loadedTemplate = template.template;
  const typeLabel = loadedTemplate.itemTypes.find((t) => t.key === item.type)?.label ?? "Unknown";
  const connections = getConnections(item.id, relationships.relationships, items.items, loadedTemplate);
  const connectOptions = getConnectOptions(item.type, loadedTemplate);

  function replaceItem(updated: Item) {
    items.setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
  }

  // Sends the changed fields and shows the saved item. Used by the checkboxes.
  async function save(changes: UpdateItemInput) {
    setError(null);
    setBusy(true);
    try {
      replaceItem(await updateItem(item!.id, changes));
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  // Two checkboxes cover three statuses: neither checked means "planned".
  function setStatus(status: ItemStatus, checked: boolean) {
    return save({ status: checked ? status : "planned" });
  }

  async function handleDelete() {
    // TODO when tasks exist: add the number of tasks
    const count = connections.length;
    const alsoDeletes = count === 0 ? "its tasks" : `${count} ${count === 1 ? "connection" : "connections"} and its tasks`;
    if (!window.confirm(`Delete "${item!.title}"? This also deletes ${alsoDeletes}.`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteItem(item!.id);
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(messageFrom(err));
      setBusy(false);
    }
  }

  async function handleRemoveConnection(connection: Connection) {
    if (!window.confirm(`Remove the connection "${connection.label}: ${connection.otherTitle}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteRelationship(connection.id);
      relationships.setRelationships((current) => current.filter((r) => r.id !== connection.id));
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  // Creates a new item and connects it to this one. Two requests: if the connection is refused
  // (for example it would make a loop), the new item is deleted again so nothing is left behind.
  // Returns an error message, or null when it worked.
  async function addConnectedItem(option: ConnectOption, title: string) {
    let newItem: Item;
    try {
      newItem = await createItem(project.id, { title, type: option.newItemType });
    } catch (err) {
      return messageFrom(err);
    }

    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? newItem.id : item!.id,
        targetItemId: option.newItemIsSource ? item!.id : newItem.id,
        type: option.relationshipType,
      });
      items.setItems((current) => [...current, newItem]);
      relationships.setRelationships((current) => [...current, relationship]);
      return null;
    } catch (err) {
      // Undo: remove the item we just created
      const undone = await deleteItem(newItem.id).then(
        () => true,
        () => false,
      );
      return undone
        ? messageFrom(err)
        : `${messageFrom(err)} The new item was created but not connected. Reload to see it.`;
    }
  }

  // Connects this item to an item that already exists. Returns an error message, or null when it worked.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  async function connectExisting(option: ConnectOption, otherItemId: string) {
    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? otherItemId : item!.id,
        targetItemId: option.newItemIsSource ? item!.id : otherItemId,
        type: option.relationshipType,
      });
      relationships.setRelationships((current) => [...current, relationship]);
      return null;
    } catch (err) {
      return messageFrom(err);
    }
  }

  const backLink = (
    <p>
      <Link to={`/projects/${project.id}`}>Back to {project.name}</Link>
    </p>
  );

  if (editing) {
    return (
      <>
        <h1>Edit {item.title}</h1>
        <ItemForm
          types={loadedTemplate.itemTypes}
          showMvp
          initialValues={{
            title: item.title,
            description: item.description ?? "",
            type: item.type,
            isMvp: item.isMvp,
          }}
          submitLabel="Save changes"
          onCancel={() => setEditing(false)}
          onSubmit={async ({ title, description, type, isMvp }) => {
            // "" clears the description, like for projects. The type is only sent when it changed.
            const changes: UpdateItemInput = {
              title,
              description,
              isMvp,
              ...(type !== item.type && { type }),
            };
            try {
              let saved: Item;
              try {
                saved = await updateItem(item.id, changes);
              } catch (err) {
                // 409: the new type would break some connections. Ask, then send again with the flag.
                const count = getInvalidRelationshipCount(err);
                if (count === null) throw err;
                const newLabel = loadedTemplate.itemTypes.find((t) => t.key === type)?.label ?? type;
                const what = count === 1 ? "1 connection that is" : `${count} connections that are`;
                if (!window.confirm(`Changing the type to ${newLabel} deletes ${what} no longer allowed. Continue?`)) {
                  return "The type was not changed.";
                }
                saved = await updateItem(item.id, { ...changes, confirmRelationshipRemoval: true });
                // The server deleted some connections, so load the list again
                relationships.refetch();
              }
              replaceItem(saved);
              setEditing(false);
              return null;
            } catch (err) {
              return messageFrom(err);
            }
          }}
        />
      </>
    );
  }

  return (
    <>
      {backLink}
      <h1>{item.title}</h1>
      <p>{typeLabel}</p>
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
      </label>
      <p>
        <button type="button" onClick={() => setEditing(true)} disabled={busy}>
          Edit
        </button>{" "}
        <button type="button" onClick={handleDelete} disabled={busy}>
          Delete
        </button>
      </p>
      {error && <p role="alert">{error}</p>}

      <h2>Connections</h2>
      {connections.length === 0 ? (
        <p>No connections yet.</p>
      ) : (
        <ul>
          {connections.map((connection) => (
            <li key={connection.id}>
              {connection.label}: {connection.otherTitle} ({connection.otherTypeLabel}){" "}
              <button type="button" onClick={() => handleRemoveConnection(connection)} disabled={busy}>
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {connectOptions.length > 0 &&
        (connecting === "new" ? (
          <ConnectedItemForm
            thisTitle={item.title}
            options={connectOptions}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, title) => {
              const message = await addConnectedItem(option, title);
              if (message === null) setConnecting(null);
              return message;
            }}
          />
        ) : connecting === "existing" ? (
          <ConnectExistingForm
            thisTitle={item.title}
            options={connectOptions}
            items={items.items.filter((other) => other.id !== item.id)}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, otherItemId) => {
              const message = await connectExisting(option, otherItemId);
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
    </>
  );
}
