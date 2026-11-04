import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { ConnectExistingForm } from "../relationships/ConnectExistingForm";
import { ConnectedItemForm } from "../relationships/ConnectedItemForm";
import { getConnectOptions, getConnections, type ConnectOption, type Connection } from "../relationships/connections";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import { ItemTasks } from "../tasks/ItemTasks";
import { useTasks } from "../tasks/useTasks";
import { ItemForm } from "./ItemForm";
import { createItem, deleteItem, updateItem } from "./itemsApi";
import type { Item, ItemStatus, UpdateItemInput } from "./types";
import { getInvalidRelationshipCount } from "./typeChange";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./ItemDetail.module.css";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// The detail view of one item: this is where an item is edited and deleted, and where its
// connections are added and removed. The File view only shows items.
export function ItemDetail({ project, itemId }: { project: Project; itemId: string }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const tasks = useTasks(project.id);
  const groups = useGroups(project.id);

  // true while the edit form is open
  const [editing, setEditing] = useState(false);
  // Which connect form is open: a new item, an existing item, or none
  const [connecting, setConnecting] = useState<"new" | "existing" | null>(null);
  // true while a request from a checkbox, a delete button or a remove button is running
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = template.loading || items.loading || relationships.loading || tasks.loading || groups.loading;
  const loadError = template.error ?? items.error ?? relationships.error ?? tasks.error ?? groups.error;

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (tasks.error) tasks.refetch();
    if (groups.error) groups.refetch();
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
  const itemTasks = tasks.tasks.filter((task) => task.itemId === item.id);
  const itemGroups = getGroupsOfItem(item.id, groups.groups);
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
    const parts = [
      connections.length > 0 && `${connections.length} ${connections.length === 1 ? "connection" : "connections"}`,
      itemTasks.length > 0 && `${itemTasks.length} ${itemTasks.length === 1 ? "task" : "tasks"}`,
    ].filter(Boolean);
    const alsoDeletes = parts.length === 0 ? "" : ` This also deletes ${parts.join(" and ")}.`;
    if (!window.confirm(`Delete "${item!.title}"?${alsoDeletes}`)) return;
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
    <Link to={`/projects/${project.id}`} className={styles.back}>
      ← Back to {project.name}
    </Link>
  );

  if (editing) {
    return (
      <section className={styles.card}>
        <h1 className={styles.title}>Edit {item.title}</h1>
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
      </section>
    );
  }

  return (
    <div className={styles.page}>
      {backLink}

      <section className={styles.card}>
        <div className={styles.tags}>
          <span className={styles.tag}>{typeLabel}</span>
          {item.isMvp && <span className={`${styles.tag} ${styles.mvp}`}>MVP</span>}
        </div>
        <h1 className={styles.title}>{item.title}</h1>
        {itemGroups.length > 0 && (
          <p className={styles.groups}>Groups: {itemGroups.map((group) => group.name).join(", ")}</p>
        )}
        {item.description && <p className={styles.description}>{item.description}</p>}

        <div className={styles.toolbar}>
          {/* Two checkboxes cover three statuses: neither checked means "planned" */}
          <div className={styles.status}>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={item.status === "in_progress"}
                disabled={busy}
                onChange={(e) => setStatus("in_progress", e.target.checked)}
              />
              In progress
            </label>
            <label className={styles.toggle}>
              <input
                type="checkbox"
                checked={item.status === "done"}
                disabled={busy}
                onChange={(e) => setStatus("done", e.target.checked)}
              />
              Done
            </label>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
            <button type="button" className={styles.danger} onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          </div>
        </div>
        {error && <p role="alert">{error}</p>}
      </section>

      <section className={styles.card}>
        <h2 className={styles.label}>Connections</h2>
        {connections.length === 0 ? (
          <p className={styles.empty}>No connections yet.</p>
        ) : (
          <ul className={styles.list}>
            {connections.map((connection) => (
              <li key={connection.id} className={styles.row}>
                <span>
                  <span className={styles.relation}>{connection.label}</span> {connection.otherTitle}{" "}
                  <span className={styles.tag}>{connection.otherTypeLabel}</span>
                </span>
                <button
                  type="button"
                  className={styles.textButton}
                  onClick={() => handleRemoveConnection(connection)}
                  disabled={busy}
                >
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
            <div className={styles.actions}>
              <button type="button" onClick={() => setConnecting("new")} disabled={busy}>
                Add connected item
              </button>
              <button type="button" className={styles.secondary} onClick={() => setConnecting("existing")} disabled={busy}>
                Connect existing item
              </button>
            </div>
          ))}
      </section>

      {/* ItemTasks is shared, so its heading, list and form are styled from here (.tasks) */}
      <section className={`${styles.card} ${styles.tasks}`}>
        <ItemTasks projectId={project.id} itemId={item.id} tasks={itemTasks} setTasks={tasks.setTasks} />
      </section>
    </div>
  );
}
