import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import type { Item } from "../items/types";
import { addItemToGroup, createGroup, deleteGroup, removeItemFromGroup, updateGroup } from "./groupsApi";
import { GroupChip } from "./GroupChip";
import { GroupColorPicker } from "./GroupColorPicker";
import { groupColorVar } from "./groupColor";
import type { Group } from "./types";
import styles from "./GroupSection.module.css";

type Props = {
  projectId: string;
  groups: Group[];
  // From useGroups in the parent
  setGroups: (next: (current: Group[]) => Group[]) => void;
  items: Item[];
  // The template's groupColors, offered as swatches
  groupColors: string[];
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// color "" = none chosen (only on create: the backend then picks the next unused one)
type FormValues = { name: string; description: string; color: string };

type FormProps = {
  initial: FormValues;
  colors: string[];
  submitLabel: string;
  busy: boolean;
  // Resolves to true when it worked
  onSubmit: (input: FormValues) => Promise<boolean>;
  onCancel?: () => void;
};

// The name, description and color fields, used to create and to edit a group
function GroupForm({ initial, colors, submitLabel, busy, onSubmit, onCancel }: FormProps) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description);
  const [color, setColor] = useState(initial.color);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const ok = await onSubmit({ name, description, color });
    // Only the create form (no cancel button) starts empty again. The edit form closes itself.
    if (ok && !onCancel) {
      setName("");
      setDescription("");
      setColor("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>
        Name
        <input type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label>
        Description (optional)
        <input
          type="text"
          maxLength={500}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <GroupColorPicker colors={colors} value={color} onChange={setColor} disabled={busy} />
      <div className={styles.formButtons}>
        <button type="submit" disabled={busy}>
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" className={styles.secondary} onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

// Create, edit and delete the groups of a project, and choose which items are in each group.
export function GroupSection({ projectId, groups, setGroups, items, groupColors }: Props) {
  // The group being edited
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Runs an API call with the busy flag and error line, and returns true when it worked
  async function run(action: () => Promise<void>) {
    setError(null);
    setBusy(true);
    try {
      await action();
      return true;
    } catch (err) {
      setError(messageFrom(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  // The description and the color are left out when empty on create
  function handleAdd({ name, description, color }: FormValues) {
    return run(async () => {
      const group = await createGroup(projectId, {
        name,
        ...(description !== "" && { description }),
        ...(color !== "" && { color }),
      });
      setGroups((current) => [...current, group]);
    });
  }

  // "" clears the description. The color is always set when editing (it starts as the group's color).
  async function handleEdit(group: Group, input: FormValues) {
    const ok = await run(async () => {
      const updated = await updateGroup(group.id, input);
      setGroups((current) => current.map((g) => (g.id === updated.id ? updated : g)));
    });
    if (ok) setEditingId(null);
    return ok;
  }

  async function handleDelete(group: Group) {
    const count = group.itemIds.length;
    const alsoChanges = count === 0 ? "" : ` Its ${count === 1 ? "item stays" : `${count} items stay`}.`;
    if (!window.confirm(`Delete the group "${group.name}"?${alsoChanges}`)) return;
    await run(async () => {
      await deleteGroup(group.id);
      setGroups((current) => current.filter((g) => g.id !== group.id));
    });
  }

  function changeItemIds(groupId: string, change: (ids: string[]) => string[]) {
    setGroups((current) => current.map((g) => (g.id === groupId ? { ...g, itemIds: change(g.itemIds) } : g)));
  }

  function handleAddItem(group: Group, itemId: string) {
    return run(async () => {
      await addItemToGroup(group.id, itemId);
      changeItemIds(group.id, (ids) => [...ids, itemId]);
    });
  }

  function handleRemoveItem(group: Group, itemId: string) {
    return run(async () => {
      await removeItemFromGroup(group.id, itemId);
      changeItemIds(group.id, (ids) => ids.filter((id) => id !== itemId));
    });
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.label}>
        Groups <span className={styles.labelCount}>{groups.length}</span>
      </h2>
      {groups.length === 0 ? (
        <p className={styles.empty}>No groups yet.</p>
      ) : (
        <ul className={styles.list}>
          {groups.map((group) => {
            const inGroup = items.filter((item) => group.itemIds.includes(item.id));
            const notInGroup = items.filter((item) => !group.itemIds.includes(item.id));
            return (
              // Each group is its own small card, with a border and a light background in the group's color
              <li key={group.id} className={styles.group} style={groupColorVar(group.color)}>
                {editingId === group.id ? (
                  <GroupForm
                    initial={{ name: group.name, description: group.description ?? "", color: group.color }}
                    colors={groupColors}
                    submitLabel="Save"
                    busy={busy}
                    onSubmit={(input) => handleEdit(group, input)}
                    onCancel={() => setEditingId(null)}
                  />
                ) : (
                  <>
                    <div className={styles.row}>
                      <span className={styles.name}>
                        <GroupChip group={group} />
                        <span className={styles.itemCount}>
                          {inGroup.length} {inGroup.length === 1 ? "item" : "items"}
                        </span>
                      </span>
                      <span className={styles.actions}>
                        <button
                          type="button"
                          className={styles.textButton}
                          disabled={busy}
                          onClick={() => setEditingId(group.id)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={`${styles.textButton} ${styles.delete}`}
                          disabled={busy}
                          onClick={() => handleDelete(group)}
                        >
                          Delete
                        </button>
                      </span>
                    </div>
                    {group.description && <p className={styles.description}>{group.description}</p>}
                  </>
                )}
                <ul className={styles.items}>
                  {inGroup.map((item) => (
                    <li key={item.id} className={styles.item}>
                      {item.title}
                      <button
                        type="button"
                        className={styles.remove}
                        aria-label={`Remove ${item.title} from ${group.name}`}
                        disabled={busy}
                        onClick={() => handleRemoveItem(group, item.id)}
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
                {notInGroup.length > 0 && (
                  // value is always "": the select only picks an item, it does not keep a choice
                  <select
                    aria-label={`Add an item to ${group.name}`}
                    value=""
                    disabled={busy}
                    onChange={(e) => handleAddItem(group, e.target.value)}
                  >
                    <option value="">+ Add item…</option>
                    {notInGroup.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {/* A dashed box, so the form reads as "make a new card" and not as one of the groups */}
      <div className={styles.newGroup}>
        <h3 className={styles.subLabel}>New group</h3>
        <GroupForm
          initial={{ name: "", description: "", color: "" }}
          colors={groupColors}
          submitLabel="Add group"
          busy={busy}
          onSubmit={handleAdd}
        />
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
