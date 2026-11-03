import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import type { Task } from "../tasks/types";
import { createSprint, deleteSprint, updateSprint } from "./sprintsApi";
import type { Sprint } from "./types";
import styles from "./SprintSection.module.css";

type Props = {
  projectId: string;
  sprints: Sprint[];
  // From useSprints and useTasks in the parent
  setSprints: (next: (current: Sprint[]) => Sprint[]) => void;
  tasks: Task[];
  setTasks: (next: (current: Task[]) => Task[]) => void;
};

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// Create, rename and delete the sprints of a project.
export function SprintSection({ projectId, sprints, setSprints, tasks, setTasks }: Props) {
  const [name, setName] = useState("");
  // The sprint being renamed, and the new name
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (name.trim() === "") {
      setError("Name is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const sprint = await createSprint(projectId, name);
      setSprints((current) => [...current, sprint]);
      setName("");
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleRename(e: FormEvent) {
    e.preventDefault();
    if (editName.trim() === "") {
      setError("Name is required.");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const updated = await updateSprint(editingId!, editName);
      setSprints((current) => current.map((s) => (s.id === updated.id ? updated : s)));
      setEditingId(null);
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(sprint: Sprint) {
    const count = tasks.filter((task) => task.sprintId === sprint.id).length;
    const alsoChanges = count === 0 ? "" : ` Its ${count === 1 ? "task stays" : `${count} tasks stay`}, without a sprint.`;
    if (!window.confirm(`Delete the sprint "${sprint.name}"?${alsoChanges}`)) return;
    setError(null);
    setBusy(true);
    try {
      await deleteSprint(sprint.id);
      setSprints((current) => current.filter((s) => s.id !== sprint.id));
      // The server keeps the tasks and sets their sprint to null, so do the same here
      setTasks((current) => current.map((t) => (t.sprintId === sprint.id ? { ...t, sprintId: null } : t)));
    } catch (err) {
      setError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.label}>Sprints</h2>
      {sprints.length === 0 ? (
        <p className={styles.empty}>No sprints yet.</p>
      ) : (
        <ul className={styles.list}>
          {sprints.map((sprint) => (
            <li key={sprint.id} className={styles.row}>
              {editingId === sprint.id ? (
                <form onSubmit={handleRename} className={styles.inlineForm}>
                  <input
                    type="text"
                    required
                    maxLength={100}
                    aria-label="Sprint name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />{" "}
                  <button type="submit" disabled={busy}>
                    Save
                  </button>{" "}
                  <button type="button" className={styles.secondary} onClick={() => setEditingId(null)}>
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <span className={styles.name}>{sprint.name}</span>
                  <span className={styles.actions}>
                    <button
                      type="button"
                      className={styles.textButton}
                      disabled={busy}
                      onClick={() => {
                        setEditingId(sprint.id);
                        setEditName(sprint.name);
                      }}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={`${styles.textButton} ${styles.delete}`}
                      disabled={busy}
                      onClick={() => handleDelete(sprint)}
                    >
                      Delete
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAdd} className={styles.addForm}>
        <label>
          New sprint
          <input type="text" required maxLength={100} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <button type="submit" disabled={busy}>
          Add sprint
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
