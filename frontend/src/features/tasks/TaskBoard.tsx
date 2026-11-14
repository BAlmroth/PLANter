import { type Item, type Template } from "../items/types";
import { StatusIcon } from "../items/StatusIcon";
import type { Sprint } from "../sprints/types";
import { BOARD_COLUMNS } from "./boardColumns";
import { TaskCard } from "./TaskCard";
import type { Task } from "./types";
import styles from "./TaskBoard.module.css";

type Props = {
  projectId: string;
  // Already filtered by the sprint choice
  tasks: Task[];
  items: Item[];
  sprints: Sprint[];
  // For the item type colors. Without it (still loading) the item tags are grey.
  template: Template | null;
  // From useTasks in the parent
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Called after a task was moved, edited or deleted, for example to load the warnings again
  onChanged?: () => void;
  // Smaller headings and cards, and a column that scrolls when it gets long. Used on the overview.
  compact?: boolean;
};

// A Trello-style board: one column per status. A card moves with the buttons, one column at a time.
export function TaskBoard({ projectId, tasks, items, sprints, template, setTasks, onChanged, compact = false }: Props) {
  return (
    <div className={`${styles.board} ${compact ? styles.compact : ""}`}>
      {BOARD_COLUMNS.map((status) => {
        const column = tasks.filter((task) => task.status === status);
        return (
          <section key={status} className={styles.column} aria-labelledby={`column-${status}`}>
            <h2 id={`column-${status}`} className={styles.columnHeading}>
              <StatusIcon status={status} showLabel />
              <span className={styles.columnCount}>{column.length}</span>
            </h2>
            {column.length === 0 ? (
              <p className={styles.empty}>No tasks.</p>
            ) : (
              <ul className={styles.cards}>
                {column.map((task) => (
                  <TaskCard
                    key={task.id}
                    projectId={projectId}
                    task={task}
                    items={items}
                    sprints={sprints}
                    template={template}
                    setTasks={setTasks}
                    onChanged={onChanged}
                  />
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
