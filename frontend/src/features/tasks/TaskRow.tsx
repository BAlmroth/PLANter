import { useState, type FormEvent, type ReactNode } from "react";
import { ApiError } from "../../lib/api";
import { deleteTask, updateTask } from "./tasksApi";
import type { Task } from "./types";

type Props = {
  task: Task;
  // From useTasks in the parent
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Shown after the title, for example a link to the task's item
  extra?: ReactNode;
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// One task in a list: tick done, edit the title, delete. Errors are shown on the row.
export function TaskRow({ task, setTasks, extra }: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sends the changes and replaces the task in the list. Returns true when it worked.
  async function save(changes: { title?: string; done?: boolean }) {
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
    if (await save({ title })) setEditing(false);
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
          <button type="submit" disabled={busy}>
            Save
          </button>{" "}
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setTitle(task.title);
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
