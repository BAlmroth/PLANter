import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../lib/api";
import type { Item } from "../items/types";
import { deleteTask, updateTask } from "./tasksApi";
import type { Task, UpdateTaskInput } from "./types";

type Props = {
  task: Task;
  // From useTasks in the parent
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Shown after the title, for example a link to the task's item
  extra?: ReactNode;
  // When given, the edit form has a dropdown to link the task to an item, or to remove the link
  items?: Item[];
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// One task in a list: tick done, edit the title, delete. Errors are shown on the row.
export function TaskRow({ task, setTasks, extra, items }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  // "" means no item
  const [itemId, setItemId] = useState(task.itemId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sends the changes and replaces the task in the list. Returns true when it worked.
  async function save(changes: UpdateTaskInput) {
    setError(null);
    setBusy(true);
    try {
      const updated = await updateTask(task.id, changes);
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)));
      return true;
    } catch (err) {
      setError(messageFrom(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSaveTitle(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }
    // itemId is only sent when the form has the dropdown. null removes the link.
    if (await save({ title, ...(items && { itemId: itemId === "" ? null : itemId }) })) setEditing(false);
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the task "${task.title}"?`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((t) => t.id !== task.id));
    } catch (err) {
      setError(messageFrom(err));
      setBusy(false);
    }
  }

  return (
    <li>
      {editing ? (
        <form onSubmit={handleSaveTitle}>
          <input
            type="text"
            required
            maxLength={100}
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />{" "}
          {items && (
            <select aria-label="Item" value={itemId} onChange={(e) => setItemId(e.target.value)}>
              <option value="">No item</option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          )}{" "}
          <button type="submit" disabled={busy}>
            Save
          </button>{" "}
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setTitle(task.title);
              setItemId(task.itemId ?? "");
              setError(null);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <label>
            <input type="checkbox" checked={task.done} disabled={busy} onChange={() => save({ done: !task.done })} />{" "}
            {task.done ? <s>{task.title}</s> : task.title}
          </label>
          {extra}{" "}
          <button type="button" onClick={() => setEditing(true)} disabled={busy}>
            Edit
          </button>{" "}
          <button type="button" onClick={handleDelete} disabled={busy}>
            Delete
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </li>
  );
}
