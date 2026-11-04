import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../lib/api";
import type { Item } from "../items/types";
import type { Sprint } from "../sprints/types";
import { deleteTask, updateTask } from "./tasksApi";
import type { Task, UpdateTaskInput } from "./types";
import styles from "./TaskRow.module.css";

type Props = {
  task: Task;
  // From useTasks in the parent
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Shown after the title, for example a link to the task's item
  extra?: ReactNode;
  // When given, the edit form has a dropdown to link the task to an item, or to remove the link
  items?: Item[];
  // The same for the sprint
  sprints?: Sprint[];
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// One task in a list: tick done, edit the title, delete. Errors are shown on the row.
export function TaskRow({ task, setTasks, extra, items, sprints }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  // "" means no item
  const [itemId, setItemId] = useState(task.itemId ?? "");
  const [sprintId, setSprintId] = useState(task.sprintId ?? "");
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
    // itemId and sprintId are only sent when the form has the dropdown. null removes the link.
    const changes = {
      title,
      ...(items && { itemId: itemId === "" ? null : itemId }),
      ...(sprints && { sprintId: sprintId === "" ? null : sprintId }),
    };
    if (await save(changes)) setEditing(false);
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
    <li className={styles.row}>
      {editing ? (
        <form onSubmit={handleSaveTitle} className={styles.editForm}>
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
          {sprints && (
            <select aria-label="Sprint" value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
              <option value="">No sprint</option>
              {sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
            </select>
          )}{" "}
          <button type="submit" disabled={busy}>
            Save
          </button>{" "}
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              setEditing(false);
              setTitle(task.title);
              setItemId(task.itemId ?? "");
              setSprintId(task.sprintId ?? "");
              setError(null);
            }}
          >
            Cancel
          </button>
        </form>
      ) : (
        <>
          <label className={styles.check}>
            <input type="checkbox" checked={task.done} disabled={busy} onChange={() => save({ done: !task.done })} />
            <span className={task.done ? styles.done : undefined}>{task.title}</span>
            {extra}
          </label>
          <span className={styles.actions}>
            <button type="button" className={styles.textButton} onClick={() => setEditing(true)} disabled={busy}>
              Edit
            </button>
            <button type="button" className={`${styles.textButton} ${styles.delete}`} onClick={handleDelete} disabled={busy}>
              Delete
            </button>
          </span>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </li>
  );
}
