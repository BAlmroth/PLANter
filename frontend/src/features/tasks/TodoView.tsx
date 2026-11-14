import { useState } from "react";
import type { Project } from "../projects/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { SprintSection } from "../sprints/SprintSection";
import { useSprints } from "../sprints/useSprints";
import { tasksForScope } from "./boardColumns";
import { NewTaskForm } from "./NewTaskForm";
import { LinkedItem } from "./LinkedItem";
import { TaskBoard } from "./TaskBoard";
import { TaskRow } from "./TaskRow";
import { useTasks } from "./useTasks";
import styles from "./TodoView.module.css";
import { Dropdown } from "../../components/Dropdown";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

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
  // Which panels are open. The New task form stays open after adding, so several tasks can be added in a row.
  const [addingTask, setAddingTask] = useState(false);
  const [managingSprints, setManagingSprints] = useState(false);
  // Board (columns per status) or List (one card per sprint)
  const [view, setView] = useState<"board" | "list">("board");
  // What the board shows: "all", "none" (no sprint) or a sprint id
  const [scope, setScope] = useState("all");

  // true when the board shows one sprint (and not all tasks or the tasks without a sprint)
  const scopeIsSprint = scope !== "all" && scope !== "none";

  const loading = tasks.loading || items.loading || sprints.loading;
  useGateLoading(loading);
  const error = tasks.error ?? items.error ?? sprints.error;

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

  // What the board can show: everything, one sprint, or the tasks without a sprint
  const scopeOptions = [
    { value: "all", label: "All tasks" },
    ...sprints.sprints.map((sprint) => ({ value: sprint.id, label: sprint.name })),
    { value: "none", label: "No sprint" },
  ];

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
      {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
      <div className={styles.header} data-tour="task-view">
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
          <div className={styles.scope}>
            Show
            <Dropdown label="Show tasks of" value={scope} options={scopeOptions} onChange={setScope} />
          </div>
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
              <NewTaskForm
                projectId={project.id}
                items={items.items}
                sprints={sprints.sprints}
                defaultSprintId={view === "board" && scopeIsSprint ? scope : ""}
                onCreated={(task) => {
                  tasks.setTasks((current) => [...current, task]);
                  onTasksChanged?.();
                }}
              />
            </section>
          )}
        </div>
      )}

      {view === "board" && (
        <div data-tour="task-board">
          <TaskBoard
            projectId={project.id}
            tasks={tasksForScope(tasks.tasks, scope)}
            items={items.items}
            sprints={sprints.sprints}
            template={template.template}
            setTasks={tasks.setTasks}
            onChanged={onTasksChanged}
          />
        </div>
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
