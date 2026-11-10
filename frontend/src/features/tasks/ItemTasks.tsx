import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import { createTask } from "./tasksApi";
import { TaskRow } from "./TaskRow";
import type { Task } from "./types";

type Props = {
  projectId: string;
  itemId: string;
  // Only the tasks linked to this item
  tasks: Task[];
  // From useTasks in the parent, which also needs the tasks (for the delete message)
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Called after a task was added or deleted, for example to load the warnings again
  onTasksChanged?: () => void;
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// The tasks of one item, shown on its detail view. New tasks here are linked to the item.
export function ItemTasks({ projectId, itemId, tasks, setTasks, onTasksChanged }: Props) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const task = await createTask(projectId, { title, itemId });
      setTasks((current) => [...current, task]);
      setTitle("");
      onTasksChanged?.();
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <h2>Tasks</h2>
      {tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} setTasks={setTasks} onDeleted={onTasksChanged} />
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd}>
        <label>
          New task
          <input
            type="text"
            required
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>
        <button type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add task"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
