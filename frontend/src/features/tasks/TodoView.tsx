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
import styles from "./TodoView.module.css";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// A link to the item a task is about. Nothing is shown if the item is not in the list.
function ItemLink({ project, itemId, items }: { project: Project; itemId: string; items: Item[] }) {
  const item = items.find((i) => i.id === itemId);
  if (!item) return null;
  return (
    <Link to={`/projects/${project.id}/items/${item.id}`} className={styles.itemLink}>
      {item.title}
    </Link>
  );
}

type Props = {
  project: Project;
  // Called after a task was added, changed or deleted, for example to load the warnings above again
  onTasksChanged?: () => void;
};

// The todo list of a project: tasks that can be linked to an item.
export function TodoView({ project, onTasksChanged }: Props) {
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
  // Which panels are open. The New task form stays open after adding, so several tasks can be added in a row.
  const [addingTask, setAddingTask] = useState(false);
  const [managingSprints, setManagingSprints] = useState(false);

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
      onTasksChanged?.();
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
    <section className={styles.page}>
      <div className={styles.header}>
        <span className={styles.count}>{tasks.tasks.filter((task) => !task.done).length} pending</span>
        {/* The forms are closed by default, so the page starts with the tasks.
            aria-expanded tells screen readers whether the panel each button controls is open. */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondary}
            aria-expanded={managingSprints}
            aria-controls="sprint-panel"
            onClick={() => setManagingSprints((open) => !open)}
          >
            {managingSprints ? "Close sprints" : "Manage sprints"}
          </button>
          <button
            type="button"
            aria-expanded={addingTask}
            aria-controls="new-task-panel"
            onClick={() => setAddingTask((open) => !open)}
          >
            {addingTask ? "Close new task" : "+ New task"}
          </button>
        </div>
      </div>

      {(managingSprints || addingTask) && (
        <div className={styles.top}>
          {managingSprints && (
            <div id="sprint-panel">
              <SprintSection
                projectId={project.id}
                sprints={sprints.sprints}
                setSprints={sprints.setSprints}
                tasks={tasks.tasks}
                setTasks={tasks.setTasks}
              />
            </div>
          )}
          {addingTask && (
            <section id="new-task-panel" className={styles.card}>
              <h2 className={styles.label}>New task</h2>
              <form onSubmit={handleAdd} className={styles.addForm}>
                <label className={styles.titleField}>
                  Title
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
            </section>
          )}
        </div>
      )}

      {groups.map((group) => (
        <section key={group.id} className={styles.card}>
          <h2 className={styles.label}>
            {group.name}
            <span className={styles.groupCount}>
              {group.tasks.filter((task) => task.done).length} / {group.tasks.length} done
            </span>
          </h2>
          {group.tasks.length === 0 ? (
            <p className={styles.empty}>No tasks.</p>
          ) : (
            <ul className={styles.list}>
              {group.tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  setTasks={tasks.setTasks}
                  items={items.items}
                  sprints={sprints.sprints}
                  extra={task.itemId && <ItemLink project={project} itemId={task.itemId} items={items.items} />}
                  onSaved={onTasksChanged}
                  onDeleted={onTasksChanged}
                />
              ))}
            </ul>
          )}
        </section>
      ))}
    </section>
  );
}
