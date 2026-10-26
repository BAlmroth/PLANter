import { useState } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { createItem, deleteItem } from "./itemsApi";
import { ItemForm } from "./ItemForm";
import { ItemRow } from "./ItemRowCard";
import { useItems } from "./useItems";
import type { Item } from "./types";
import { useTemplate } from "./useTemplate";
import { getConnectOptions, getConnections, type ConnectOption } from "../relationships/connections";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";

// The File view: a project's items grouped by category.
export function FileView({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  // true while the add form is open
  const [adding, setAdding] = useState(false);

  const loading = template.loading || items.loading || relationships.loading;
  const error = template.error ?? items.error ?? relationships.error;

  // Retry only the request that failed
  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
  }

  // Show a saved or deleted item without asking the server for the whole list again
  function replaceItem(updated: Item) {
    items.setItems((current) => current.map((item) => (item.id === updated.id ? updated : item)));
  }
  function removeItem(id: string) {
    items.setItems((current) => current.filter((item) => item.id !== id));
  }

  // Creates a new item and connects it to `item`. Two requests: if the connection is refused
  // (for example it would make a loop), the new item is deleted again so nothing is left behind.
  // Returns an error message, or null when it worked.
  async function addConnectedItem(item: Item, option: ConnectOption, title: string) {
    const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

    let newItem: Item;
    try {
      newItem = await createItem(project.id, { title, type: option.newItemType });
    } catch (err) {
      return messageFrom(err);
    }

    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? newItem.id : item.id,
        targetItemId: option.newItemIsSource ? item.id : newItem.id,
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

  // Connects `item` to an item that already exists. Returns an error message, or null when it worked.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  async function connectExisting(item: Item, option: ConnectOption, otherItemId: string) {
    try {
      const relationship = await createRelationship({
        sourceItemId: option.newItemIsSource ? otherItemId : item.id,
        targetItemId: option.newItemIsSource ? item.id : otherItemId,
        type: option.relationshipType,
      });
      relationships.setRelationships((current) => [...current, relationship]);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Something went wrong.";
    }
  }

  async function removeConnection(relationshipId: string) {
    try {
      await deleteRelationship(relationshipId);
      relationships.setRelationships((current) => current.filter((r) => r.id !== relationshipId));
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Something went wrong.";
    }
  }

  if (loading) return <p>Loading items…</p>;

  if (error || !template.template) {
    return (
      <div role="alert">
        <p>{error ?? "Something went wrong."}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  // template.template is set here (checked above)
  const connectionsOf = (item: Item) =>
    getConnections(item.id, relationships.relationships, items.items, template.template!);

  // Items whose type is not in the template (for example an old key) go under "Unknown"
  const knownKeys = template.template.itemTypes.map((type) => type.key);
  const unknownItems = items.items.filter((item) => !knownKeys.includes(item.type));

  return (
    <section>
      {adding ? (
        <ItemForm
          types={template.template.itemTypes}
          submitLabel="Add item"
          onCancel={() => setAdding(false)}
          onSubmit={async ({ title, description, type }) => {
            try {
              const item = await createItem(project.id, {
                title,
                type,
                ...(description !== "" && { description }),
              });
              // Show the new item without asking the server for the whole list again
              items.setItems((current) => [...current, item]);
              setAdding(false);
              return null;
            } catch (err) {
              return err instanceof ApiError ? err.message : "Something went wrong.";
            }
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)}>
          Add Item
        </button>
      )}

      {template.template.itemTypes.map((type) => {
        const typeItems = items.items.filter((item) => item.type === type.key);
        return (
          <section key={type.key}>
            <h2>{type.pluralLabel}</h2>
            {typeItems.length === 0 ? (
              <p>No items yet.</p>
            ) : (
              <ul>
                {typeItems.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    connections={connectionsOf(item)}
                    connectOptions={getConnectOptions(item.type, template.template!)}
                    onAddConnected={(option, title) => addConnectedItem(item, option, title)}
                    otherItems={items.items.filter((other) => other.id !== item.id)}
                    onConnectExisting={(option, otherItemId) => connectExisting(item, option, otherItemId)}
                    onDeleteConnection={removeConnection}
                    onUpdated={replaceItem}
                    onDeleted={removeItem}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {unknownItems.length > 0 && (
        <section>
          <h2>Unknown</h2>
          <ul>
            {unknownItems.map((item) => (
              <ItemRow
                    key={item.id}
                    item={item}
                    connections={connectionsOf(item)}
                    connectOptions={getConnectOptions(item.type, template.template!)}
                    onAddConnected={(option, title) => addConnectedItem(item, option, title)}
                    otherItems={items.items.filter((other) => other.id !== item.id)}
                    onConnectExisting={(option, otherItemId) => connectExisting(item, option, otherItemId)}
                    onDeleteConnection={removeConnection}
                    onUpdated={replaceItem}
                    onDeleted={removeItem}
                  />
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}