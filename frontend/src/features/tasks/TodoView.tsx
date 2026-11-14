import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import type { Project } from "../projects/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { SprintSection } from "../sprints/SprintSection";
import { useSprints } from "../sprints/useSprints";
import { tasksForScope } from "./boardColumns";
import { createTask } from "./tasksApi";
import { LinkedItem } from "./LinkedItem";
import { TaskBoard } from "./TaskBoard";
import { TaskRow } from "./TaskRow";
import { useTasks } from "./useTasks";
import styles from "./TodoView.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

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
  // Only for the item colors on the board, so it never blocks the page
  const template = useTemplate(project.template);
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
  // Board (columns per status) or List (one card per sprint)
  const [view, setView] = useState<"board" | "list">("board");
  // What the board shows: "all", "none" (no sprint) or a sprint id
  const [scope, setScope] = useState("all");

  const loading = tasks.loading || items.loading || sprints.loading;
  useGateLoading(loading);
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

  if (loading) return <Loader label="Loading todo list…" size="section" />;

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
        {/* aria-pressed tells screen readers which of the two views is on */}
        <div className={styles.viewToggle} role="group" aria-label="View">
          <button type="button" aria-pressed={view === "board"} onClick={() => setView("board")}>
            Board
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}>
            List
          </button>
        </div>
        {view === "board" && (
          <label className={styles.scope}>
            Show
            <select value={scope} onChange={(e) => setScope(e.target.value)}>
              <option value="all">All tasks</option>
              {sprints.sprints.map((sprint) => (
                <option key={sprint.id} value={sprint.id}>
                  {sprint.name}
                </option>
              ))}
              <option value="none">No sprint</option>
            </select>
          </label>
        )}
        <span className={styles.count}>{tasks.tasks.filter((task) => task.status !== "done").length} pending</span>
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

      {view === "board" && (
        <TaskBoard
          projectId={project.id}
          tasks={tasksForScope(tasks.tasks, scope)}
          items={items.items}
          sprints={sprints.sprints}
          template={template.template}
          setTasks={tasks.setTasks}
          onMoved={onTasksChanged}
        />
      )}

      {view === "list" && groups.map((group) => (
        <section key={group.id} className={styles.card}>
          <h2 className={styles.label}>
            {group.name}
            <span className={styles.groupCount}>
              {group.tasks.filter((task) => task.status === "done").length} / {group.tasks.length} done
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
                  extra={
                    <LinkedItem
                      projectId={project.id}
                      item={items.items.find((i) => i.id === task.itemId)}
                      template={template.template}
                    />
                  }
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
