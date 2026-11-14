import { useState } from "react";
import type { Sprint } from "../sprints/types";
import { NewTaskForm } from "./NewTaskForm";
import { TaskRow } from "./TaskRow";
import type { Task } from "./types";
import styles from "./ItemTasks.module.css";

type Props = {
  projectId: string;
  itemId: string;
  // Only the tasks linked to this item
  tasks: Task[];
  // For the sprint choice in the form. The list may still be empty while the sprints load.
  sprints: Sprint[];
  // From useTasks in the parent, which also needs the tasks (for the delete message)
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Called after a task was added or deleted, for example to load the warnings again
  onTasksChanged?: () => void;
};

// The tasks of one item, shown on its detail view. New tasks here are linked to the item.
// The form is closed until "+ New task" is clicked, like the other cards of the page.
export function ItemTasks({ projectId, itemId, tasks, sprints, setTasks, onTasksChanged }: Props) {
  const [adding, setAdding] = useState(false);

  return (
    <>
      <div className={styles.header}>
        <h2 className={styles.title}>
          Tasks
          {tasks.length > 0 && <span className={styles.count}>{tasks.length}</span>}
        </h2>
        <button
          type="button"
          className={styles.secondary}
          aria-expanded={adding}
          aria-controls="item-new-task"
          onClick={() => setAdding((open) => !open)}
        >
          {adding ? "Close new task" : "+ New task"}
        </button>
      </div>

      {adding && (
        <div id="item-new-task" className={styles.newTask}>
          <NewTaskForm
            projectId={projectId}
            // No item list needed: the item is fixed
            items={[]}
            sprints={sprints}
            fixedItemId={itemId}
            onCreated={(task) => {
              setTasks((current) => [...current, task]);
              onTasksChanged?.();
            }}
          />
        </div>
      )}

      {tasks.length === 0 ? (
        <p className={styles.empty}>No tasks yet.</p>
      ) : (
        <ul className={styles.list}>
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} setTasks={setTasks} onDeleted={onTasksChanged} />
          ))}
        </ul>
      )}
    </>
  );
}
