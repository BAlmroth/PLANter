import { useState, type FormEvent } from "react";
import { ActionMenu } from "../../components/ActionMenu";
import { Dropdown } from "../../components/Dropdown";
import { useConfirm } from "../../components/useConfirm";
import { ApiError } from "../../lib/api";
import { STATUS_LABELS, type Item, type ItemStatus, type Template } from "../items/types";
import type { Sprint } from "../sprints/types";
import { nextStatus, previousStatus } from "./boardColumns";
import { LinkedItem } from "./LinkedItem";
import { deleteTask, updateTask } from "./tasksApi";
import type { Task, UpdateTaskInput } from "./types";
import styles from "./TaskBoard.module.css";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

type Props = {
  projectId: string;
  task: Task;
  items: Item[];
  sprints: Sprint[];
  template: Template | null;
  // From useTasks in the parent
  setTasks: (next: (current: Task[]) => Task[]) => void;
  // Called after the task was moved, edited or deleted, for example to load the warnings again
  onChanged?: () => void;
};

// One task on the board: move it with the arrows, edit its title, item and sprint, or delete it.
// It has its own state, so an error or an open edit form belongs to this card only.
export function TaskCard({ projectId, task, items, sprints, template, setTasks, onChanged }: Props) {
  const { confirm, modal } = useConfirm();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  // "" means no item / no sprint
  const [itemId, setItemId] = useState(task.itemId ?? "");
  const [sprintId, setSprintId] = useState(task.sprintId ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Sends the changes and replaces the task in the list. Returns true when it worked.
  async function save(changes: UpdateTaskInput) {
    setError(null);
    setBusy(true);
    try {
      const updated = await updateTask(task.id, changes);
      setTasks((current) => current.map((t) => (t.id === task.id ? updated : t)));
      onChanged?.();
      return true;
    } catch (err) {
      setError(messageFrom(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (title.trim() === "") {
      setError("Title is required.");
      return;
    }
    // null removes the link to the item or the sprint
    const saved = await save({
      title,
      itemId: itemId === "" ? null : itemId,
      sprintId: sprintId === "" ? null : sprintId,
    });
    if (saved) setEditing(false);
  }

  function cancelEdit() {
    setEditing(false);
    setTitle(task.title);
    setItemId(task.itemId ?? "");
    setSprintId(task.sprintId ?? "");
    setError(null);
  }

  async function handleDelete() {
    if (!(await confirm({ title: "Delete task?", message: `"${task.title}" will be deleted.` }))) return;
    setError(null);
    setBusy(true);
    try {
      await deleteTask(task.id);
      setTasks((current) => current.filter((t) => t.id !== task.id));
      onChanged?.();
    } catch (err) {
      setError(messageFrom(err));
      setBusy(false);
    }
  }

  const item = items.find((i) => i.id === task.itemId);
  const sprint = sprints.find((s) => s.id === task.sprintId);
  const back = previousStatus(task.status);
  const forward = nextStatus(task.status);

  if (editing) {
    return (
      <li className={styles.card}>
        {modal}
        <form onSubmit={handleSubmit} className={styles.editForm}>
          <input
            type="text"
            required
            maxLength={100}
            aria-label="Task title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Dropdown
            label="Item"
            value={itemId}
            options={[{ value: "", label: "No item" }, ...items.map((i) => ({ value: i.id, label: i.title }))]}
            onChange={setItemId}
            fullWidth
          />
          <Dropdown
            label="Sprint"
            value={sprintId}
            options={[{ value: "", label: "No sprint" }, ...sprints.map((s) => ({ value: s.id, label: s.name }))]}
            onChange={setSprintId}
            fullWidth
          />
          <div className={styles.editButtons}>
            <button type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </button>
            <button type="button" className={styles.cancel} onClick={cancelEdit} disabled={busy}>
              Cancel
            </button>
          </div>
        </form>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
      </li>
    );
  }

  return (
    <li className={styles.card}>
      {modal}
      <div className={styles.titleRow}>
        <p className={styles.title}>{task.title}</p>
        <ActionMenu
          label={`Edit or delete "${task.title}"`}
          disabled={busy}
          actions={[
            { label: "Edit", onSelect: () => setEditing(true) },
            { label: "Delete", onSelect: handleDelete, danger: true },
          ]}
        />
      </div>
      {(item || sprint) && (
        <p className={styles.meta}>
          <LinkedItem projectId={projectId} item={item} template={template} />
          {sprint && <span className={styles.sprintTag}>{sprint.name}</span>}
        </p>
      )}
      <div className={styles.moves}>
        {back && <MoveButton task={task} to={back} direction="back" busy={busy} onMove={(status) => save({ status })} />}
        {forward && (
          <MoveButton task={task} to={forward} direction="forward" busy={busy} onMove={(status) => save({ status })} />
        )}
      </div>
      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}
    </li>
  );
}

type MoveProps = {
  task: Task;
  to: ItemStatus;
  direction: "back" | "forward";
  busy: boolean;
  onMove: (status: ItemStatus) => void;
};

// The arrow button that moves a card one column. The text is hidden on the compact board (the overview),
// the tooltip and aria-label always say where it goes.
function MoveButton({ task, to, direction, busy, onMove }: MoveProps) {
  const label = STATUS_LABELS[to];
  const back = direction === "back";
  return (
    <button
      type="button"
      className={`${styles.move} ${back ? "" : styles.forward}`}
      disabled={busy}
      onClick={() => onMove(to)}
      aria-label={back ? `Move "${task.title}" back to ${label}` : `Move "${task.title}" to ${label}`}
      title={back ? `Back to ${label}` : `Move to ${label}`}
    >
      {back ? "←" : null}
      <span className={styles.moveText}>{back ? ` ${label}` : `${label} `}</span>
      {back ? null : "→"}
    </button>
  );
}
