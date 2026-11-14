import { useState } from "react";
import { ApiError } from "../../lib/api";
import { STATUS_LABELS, type Item, type ItemStatus, type Template } from "../items/types";
import { StatusIcon } from "../items/StatusIcon";
import type { Sprint } from "../sprints/types";
import { BOARD_COLUMNS, nextStatus, previousStatus } from "./boardColumns";
import { LinkedItem } from "./LinkedItem";
import { updateTask } from "./tasksApi";
import type { Task } from "./types";
import styles from "./TaskBoard.module.css";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

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
  // Called after a task was moved, for example to load the warnings again
  onMoved?: () => void;
  // Smaller headings and cards, and a column that scrolls when it gets long. Used on the overview.
  compact?: boolean;
};

// A Trello-style board: one column per status. A card moves with the buttons, one column at a time.
export function TaskBoard({ projectId, tasks, items, sprints, template, setTasks, onMoved, compact = false }: Props) {
  // Which task is being saved, and the error of the last move (shown on that card)
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<{ taskId: string; message: string } | null>(null);

  async function move(task: Task, status: ItemStatus) {
    setError(null);
    setBusyId(task.id);
    try {
      const updated = await updateTask(task.id, { status });
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)));
      onMoved?.();
    } catch (err) {
      setError({ taskId: task.id, message: messageFrom(err) });
    } finally {
      setBusyId(null);
    }
  }

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
                {column.map((task) => {
                  const item = items.find((i) => i.id === task.itemId);
                  const sprint = sprints.find((s) => s.id === task.sprintId);
                  const back = previousStatus(task.status);
                  const forward = nextStatus(task.status);
                  return (
                    <li key={task.id} className={styles.card}>
                      <p className={styles.title}>{task.title}</p>
                      {(item || sprint) && (
                        <p className={styles.meta}>
                          <LinkedItem projectId={projectId} item={item} template={template} />
                          {sprint && <span className={styles.sprintTag}>{sprint.name}</span>}
                        </p>
                      )}
                      <div className={styles.moves}>
                        {back && (
                          <button
                            type="button"
                            className={styles.move}
                            disabled={busyId === task.id}
                            onClick={() => move(task, back)}
                            aria-label={`Move "${task.title}" back to ${STATUS_LABELS[back]}`}
                            title={`Back to ${STATUS_LABELS[back]}`}
                          >
                            ←<span className={styles.moveText}> {STATUS_LABELS[back]}</span>
                          </button>
                        )}
                        {forward && (
                          <button
                            type="button"
                            className={`${styles.move} ${styles.forward}`}
                            disabled={busyId === task.id}
                            onClick={() => move(task, forward)}
                            aria-label={`Move "${task.title}" to ${STATUS_LABELS[forward]}`}
                            title={`Move to ${STATUS_LABELS[forward]}`}
                          >
                            <span className={styles.moveText}>{STATUS_LABELS[forward]} </span>→
                          </button>
                        )}
                      </div>
                      {error?.taskId === task.id && <p role="alert" className={styles.error}>{error.message}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
