import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import type { Item } from "../items/types";
import { useItems } from "../items/useItems";
import { createTask } from "./tasksApi";
import { TaskRow } from "./TaskRow";
import { useTasks } from "./useTasks";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// A link to the item a task is about. Nothing is shown if the item is not in the list.
function ItemLink({ project, itemId, items }: { project: Project; itemId: string; items: Item[] }) {
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;
  return (
    <small>
      {" "}
      (<Link to={`/projects/${project.id}/items/${item.id}`}>{item.title}</Link>)
    </small>
  );
}

// The todo list of a project: tasks that can be linked to an item.
export function TodoView({ project }: { project: Project }) {
  const tasks = useTasks(project.id);
  const items = useItems(project.id);
  const [title, setTitle] = useState("");
  // "" means no item
  const [itemId, setItemId] = useState("");
  // Shown under the form when adding fails (errors of a task are shown on its row)
  const [actionError, setActionError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loading = tasks.loading || items.loading;
  const error = tasks.error ?? items.error;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setActionError("Title is required.");
      return;
    }
    setActionError(null);
    setAdding(true);
    try {
      const task = await createTask(project.id, { title, ...(itemId !== "" && { itemId }) });
      tasks.setTasks((current) => [...current, task]);
      setTitle("");
      setItemId("");
    } catch (err) {
      setActionError(messageFrom(err));
    } finally {
      setAdding(false);
    }
  }

  function tryAgain() {
    if (tasks.error) tasks.refetch();
    if (items.error) items.refetch();
  }

  if (loading) return <p>Loading todo list…</p>;

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <section>
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
        <label>
          Item (optional)
          <select value={itemId} onChange={(e) => setItemId(e.target.value)}>
            <option value="">No item</option>
            {items.items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add task"}
        </button>
      </form>
      {actionError && <p role="alert">{actionError}</p>}

      {tasks.tasks.length === 0 ? (
        <p>No tasks yet.</p>
      ) : (
        <ul>
          {tasks.tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              setTasks={tasks.setTasks}
              items={items.items}
              extra={task.itemId && <ItemLink project={project} itemId={task.itemId} items={items.items} />}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
