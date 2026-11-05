import { useState, type FormEvent } from "react";
import { FormField } from "../../components/FormField";
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
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// The tasks of one item, shown on its detail view. New tasks here are linked to the item.
export function ItemTasks({ projectId, itemId, tasks, setTasks }: Props) {
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    setTitleError(null);
    if (title.trim() === "") {
      setTitleError("Title is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const task = await createTask(projectId, { title, itemId });
      setTasks((current) => [...current, task]);
      setTitle("");
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
            <TaskRow key={task.id} task={task} setTasks={setTasks} />
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} noValidate>
        <FormField label="New task" required error={titleError}>
          <input
            type="text"
            maxLength={100}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </FormField>
        <button type="submit" disabled={busy}>
          {busy ? "Adding…" : "Add task"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
