import { useState, type FormEvent } from "react";
import { Dropdown } from "../../components/Dropdown";
import { ApiError } from "../../lib/api";
import type { Item } from "../items/types";
import type { Sprint } from "../sprints/types";
import { createTask } from "./tasksApi";
import type { Task } from "./types";
import styles from "./NewTaskForm.module.css";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

type Props = {
  projectId: string;
  items: Item[];
  sprints: Sprint[];
  // When given, every new task is about this item and the form has no Item dropdown (the item page)
  fixedItemId?: string;
  // The sprint that is selected when the form opens, for example the sprint the board is showing. "" means none.
  defaultSprintId?: string;
  // Called with the new task, so the parent can add it to its list
  onCreated: (task: Task) => void;
};

// The form that adds a task: a title, and optionally the item it is about and a sprint.
// Used on the Tasks page and on the overview. It stays open after adding, so several tasks can be added in a row.
export function NewTaskForm({ projectId, items, sprints, fixedItemId, defaultSprintId = "", onCreated }: Props) {
  const [title, setTitle] = useState("");
  // "" means no item / no sprint
  const [itemId, setItemId] = useState("");
  const [sprintId, setSprintId] = useState(defaultSprintId);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }
    setError(null);
    setAdding(true);
    try {
      const task = await createTask(projectId, {
        title,
        ...(fixedItemId ? { itemId: fixedItemId } : itemId !== "" && { itemId }),
        ...(sprintId !== "" && { sprintId }),
      });
      onCreated(task);
      // Empty the title and the item, but keep the sprint: tasks added in a row mostly go in the same sprint
      setTitle("");
      setItemId("");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setAdding(false);
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.titleField}>
          Title
          <input type="text" required maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        {fixedItemId === undefined && (
          <div className={styles.field}>
            <span>Item (optional)</span>
            <Dropdown
              label="Item"
              value={itemId}
              options={[{ value: "", label: "No item" }, ...items.map((i) => ({ value: i.id, label: i.title }))]}
              onChange={setItemId}
              fullWidth
            />
          </div>
        )}
        <div className={styles.field}>
          <span>Sprint (optional)</span>
          <Dropdown
            label="Sprint"
            value={sprintId}
            options={[{ value: "", label: "No sprint" }, ...sprints.map((s) => ({ value: s.id, label: s.name }))]}
            onChange={setSprintId}
            fullWidth
          />
        </div>
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add task"}
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </>
  );
}
