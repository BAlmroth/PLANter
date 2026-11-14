import { useConfirm } from "../../components/useConfirm";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { getConnectOptions, getConnections, type ConnectOption, type Connection, } from "../relationships/connections";
import { useProjectContext } from "../projects/useProjectContext";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import { useItemDetails } from "../itemDetails/useItemDetails";
import { ItemMoodboard } from "../moodboard/ItemMoodboard";
import { ItemTasks } from "../tasks/ItemTasks";
import type { Warning } from "../warnings/types";
import { useSprints } from "../sprints/useSprints";
import { useTasks } from "../tasks/useTasks";
import { ItemConnections } from "./ItemConnections";
import { ItemDetailsTiles } from "./ItemDetailsTiles";
import { ItemForm } from "./ItemForm";
import { ItemHeader } from "./ItemHeader";
import { ItemPhoto } from "./ItemPhoto";
import { ItemWarnings } from "./ItemWarnings";
import { createItem, deleteItem, updateItem } from "./itemsApi";
import type { Item, ItemStatus, UpdateItemInput } from "./types";
import { getInvalidRelationshipCount } from "./typeChange";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./ItemDetail.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

type Props = {
  project: Project;
  itemId: string;
  // The warnings of this item only (from the project's warnings in ProjectPage)
  warnings: Warning[];
  // Loads the project's warnings again, after a change that can add or remove one
  refreshWarnings: () => void;
  // Loads the progress numbers again (shown in the sub header), after a change to an item's status or type
  refreshProgress: () => void;
};

// The detail view of one item: this is where an item is edited and deleted, and where its
// connections are added and removed. The File view only shows items.
// Layout: a header (badges, actions), then a wide main column (photo, details,
// connections, tasks) and a narrow side column (description, warnings, moodboard).
export function ItemDetail({ project, itemId, warnings, refreshWarnings, refreshProgress }: Props) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const tasks = useTasks(project.id);
  // Only for the sprint choice in the New task form, so it does not hold up the page
  const sprints = useSprints(project.id);
  const groups = useGroups(project.id);
  const details = useItemDetails(itemId);
  const { setItemCrumb } = useProjectContext();

  // The sub header shows this item's title and type in its trail. Runs again when either changes.
  const crumbItem = items.items.find((i) => i.id === itemId);
  const crumbTitle = crumbItem?.title;
  const crumbTypeLabel = template.template?.itemTypes.find((t) => t.key === crumbItem?.type)?.pluralLabel ?? "Unknown";
  useEffect(() => {
    setItemCrumb(crumbTitle ? { title: crumbTitle, typeLabel: crumbTypeLabel } : null);
    return () => setItemCrumb(null);
  }, [crumbTitle, crumbTypeLabel, setItemCrumb]);

  // true while the edit form is open
  const { confirm, modal } = useConfirm();
  const [editing, setEditing] = useState(false);
  // true while a request from a checkbox, a delete button or a remove button is running
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = template.loading || items.loading || relationships.loading || tasks.loading || groups.loading || details.loading;
  useGateLoading(loading);
  const loadError = template.error ?? items.error ?? relationships.error ?? tasks.error ?? groups.error ?? details.error;

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (tasks.error) tasks.refetch();
    if (groups.error) groups.refetch();
    if (details.error) details.refetch();
  }

  if (loading) return <Loader label="Loading item…" size="page" />;

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
        <h2>Item not found</h2>
        <p>
          <Link to={`/projects/${project.id}`}>Back to {project.name}</Link>
        </p>
      </>
    );
  }

  const loadedTemplate = template.template;
  const connections = getConnections(item.id, relationships.relationships, items.items, loadedTemplate);
  const itemTasks = tasks.tasks.filter((task) => task.itemId === item.id);
  const itemGroups = getGroupsOfItem(item.id, groups.groups);
  const connectOptions = getConnectOptions(item.type, loadedTemplate);

  function replaceItem(updated: Item) {
    items.setItems((current) => current.map((i) => (i.id === updated.id ? updated : i)));
  }

  // Sends the changed fields and shows the saved item. Used by the status checkboxes.
  // A new status changes the progress and can change the warnings, so both are loaded again.
  async function save(changes: UpdateItemInput) {
    setError(null);
    setBusy(true);
    try {
      replaceItem(await updateItem(item!.id, changes));
      refreshWarnings();
      refreshProgress();
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
      details.details.length > 0 &&
        `${details.details.length} moodboard ${details.details.length === 1 ? "entry" : "entries"}`,
    ].filter(Boolean);
    const alsoDeletes = parts.length === 0 ? "" : ` This also deletes ${parts.join(" and ")}.`;
    if (!(await confirm({ title: "Delete item?", message: `"${item!.title}" will be deleted.${alsoDeletes}` }))) return;
    setError(null);
    setBusy(true);
    try {
      await deleteItem(item!.id);
      // The item and its warnings are gone, so the project page needs fresh numbers
      refreshProgress();
      refreshWarnings();
      navigate(`/projects/${project.id}`);
    } catch (err) {
      setError(messageFrom(err));
      setBusy(false);
    }
  }

  async function handleRemoveConnection(connection: Connection) {
    if (!(await confirm({ title: "Remove connection?", message: `"${connection.label}: ${connection.otherTitle}" will be removed.`, confirmLabel: "Remove" }))) return;
    setError(null);
    setBusy(true);
    try {
      await deleteRelationship(connection.id);
      relationships.setRelationships((current) => current.filter((r) => r.id !== connection.id));
      refreshWarnings();
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
      refreshWarnings();
      refreshProgress(); // the new item counts as planned
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
      refreshWarnings();
      return null;
    } catch (err) {
      return messageFrom(err);
    }
  }

  if (editing) {
    return (
      <section className={styles.card}>
        {modal}
        <h2 className={styles.title}>Edit {item.title}</h2>
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
                if (!(await confirm({ title: "Change type?", message: `Changing the type to ${newLabel} deletes ${what} no longer allowed.`, confirmLabel: "Change type" }))) {
                  return "The type was not changed.";
                }
                saved = await updateItem(item.id, { ...changes, confirmRelationshipRemoval: true });
                // The server deleted some connections, so load the list again
                relationships.refetch();
              }
              replaceItem(saved);
              // The title, type or MVP flag may have changed, and with them the warnings
              refreshWarnings();
              refreshProgress(); // a new type moves the item to another category
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

  const typeInfo = loadedTemplate.itemTypes.find((t) => t.key === item.type);
  const doneTasks = itemTasks.filter((task) => task.status === "done").length;

  return (
    <div className={styles.page}>
      {modal}
      <ItemHeader
        item={item}
        template={loadedTemplate}
        groups={itemGroups}
        busy={busy}
        error={error}
        onSetStatus={setStatus}
        onDelete={handleDelete}
        onEdit={() => setEditing(true)}
      />

      <div className={styles.columns}>
        {/* --- Main column --- */}
        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Main photo</h2>
            {/* The grey "stage" behind the photo, like a preview area */}
            <div className={styles.stage}>
              <ItemPhoto item={item} onChange={replaceItem} />
            </div>
          </section>

          <ItemDetailsTiles
            item={item}
            typeLabel={typeInfo?.label ?? "Unknown"}
            connectionCount={connections.length}
            doneTasks={doneTasks}
            totalTasks={itemTasks.length}
          />

          <ItemConnections
            item={item}
            template={loadedTemplate}
            allItems={items.items}
            connections={connections}
            connectOptions={connectOptions}
            busy={busy}
            onRemove={handleRemoveConnection}
            onAddConnectedItem={addConnectedItem}
            onConnectExisting={connectExisting}
          />

          <section className={styles.card} data-tour="item-tasks">
            {/* Adding or deleting a task can add or remove a warning ("is part of the MVP but has no tasks"), so ask again */}
            <ItemTasks
              projectId={project.id}
              itemId={item.id}
              tasks={itemTasks}
              sprints={sprints.sprints}
              setTasks={tasks.setTasks}
              onTasksChanged={refreshWarnings}
            />
          </section>
        </div>

        {/* --- Side column --- */}
        <div className={styles.column}>
          <section className={styles.card}>
            <h2 className={styles.cardTitle}>Description</h2>
            {item.description ? (
              <p className={styles.description}>{item.description}</p>
            ) : (
              <p className={styles.empty}>No description yet. Add one with Edit item.</p>
            )}
          </section>

          <ItemWarnings itemTitle={item.title} warnings={warnings} />

          <ItemMoodboard projectId={project.id} itemId={item.id} details={details} />
        </div>
      </div>
    </div>
  );
}
