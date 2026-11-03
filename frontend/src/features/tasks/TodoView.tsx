import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import type { Item } from "../items/types";
import { useItems } from "../items/useItems";
import { SprintSection } from "../sprints/SprintSection";
import { useSprints } from "../sprints/useSprints";
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
  const sprints = useSprints(project.id);
  const [title, setTitle] = useState("");
  // "" means no item
  const [itemId, setItemId] = useState("");
  const [sprintId, setSprintId] = useState("");
  // Shown under the form when adding fails (errors of a task are shown on its row)
  const [actionError, setActionError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const loading = tasks.loading || items.loading || sprints.loading;
  const error = tasks.error ?? items.error ?? sprints.error;

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setActionError("Title is required.");
      return;
    }
    setActionError(null);
    setAdding(true);
    try {
      const task = await createTask(project.id, {
        title,
        ...(itemId !== "" && { itemId }),
        ...(sprintId !== "" && { sprintId }),
      });
      tasks.setTasks((current) => [...current, task]);
      setTitle("");
      setItemId("");
      setSprintId("");
    } catch (err) {
      setActionError(messageFrom(err));
    } finally {
      setAdding(false);
    }
  }

  function tryAgain() {
    if (tasks.error) tasks.refetch();
    if (items.error) items.refetch();
    if (sprints.error) sprints.refetch();
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

  // One group per sprint, and the tasks without a sprint last
  const groups = [
    ...sprints.sprints.map((sprint) => ({
      id: sprint.id,
      name: sprint.name,
      tasks: tasks.tasks.filter((task) => task.sprintId === sprint.id),
    })),
    { id: "no-sprint", name: "No sprint", tasks: tasks.tasks.filter((task) => task.sprintId === null) },
  ];

  return (
    <section>
      <SprintSection
        projectId={project.id}
        sprints={sprints.sprints}
        setSprints={sprints.setSprints}
        tasks={tasks.tasks}
        setTasks={tasks.setTasks}
      />
      <h2>Tasks</h2>
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
        <label>
          Sprint (optional)
          <select value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
            <option value="">No sprint</option>
            {sprints.sprints.map((sprint) => (
              <option key={sprint.id} value={sprint.id}>
                {sprint.name}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={adding}>
          {adding ? "Adding…" : "Add task"}
        </button>
      </form>
      {actionError && <p role="alert">{actionError}</p>}

      {groups.map((group) => (
        <div key={group.id}>
          <h3>{group.name}</h3>
          {group.tasks.length === 0 ? (
            <p>No tasks.</p>
          ) : (
            <ul>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  setTasks={tasks.setTasks}
                  items={items.items}
                  sprints={sprints.sprints}
                  extra={task.itemId && <ItemLink project={project} itemId={task.itemId} items={items.items} />}
                />
              ))}
            </ul>
          )}
        </div>
      ))}
    </section>
  );
}
