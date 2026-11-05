import { useState } from "react";
import type { FormEvent } from "react";
import { FieldError } from "../../components/FormField";
import { ApiError } from "../../lib/api";
import { createInspiration, deleteInspiration, updateInspiration } from "../inspirations/inspirationsApi";
import type { Inspiration } from "../inspirations/types";
import { useInspirations } from "../inspirations/useInspirations";
import { OverviewCard } from "./OverviewCard";
import { isHttpUrl } from "./isHttpUrl";
import styles from "./ProjectOverview.module.css";

type FieldErrors = { title?: string; url?: string };

// Same rules as the backend: a title, and a link (when given) that starts with http(s)://
function validate(title: string, url: string): FieldErrors {
  const errors: FieldErrors = {};
  if (title.trim() === "") errors.title = "Title is required.";
  if (url.trim() !== "" && !isHttpUrl(url.trim())) errors.url = "The link must start with http:// or https://.";
  return errors;
}

// The Inspiration page: all links and notes of the project, with add and delete
export function InspirationPageCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch, setInspirations } = useInspirations(projectId);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // The entry being edited (one at a time) and the values in its form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editText, setEditText] = useState("");
  const [addErrors, setAddErrors] = useState<FieldErrors>({});
  const [editErrors, setEditErrors] = useState<FieldErrors>({});

  function startEdit(inspiration: Inspiration) {
    setActionError(null);
    setEditingId(inspiration.id);
    setEditErrors({});
    setEditTitle(inspiration.title);
    setEditUrl(inspiration.url ?? "");
    setEditText(inspiration.text ?? "");
  }

  async function handleSave(event: FormEvent, id: string) {
    event.preventDefault();
    setActionError(null);
    const errors = validate(editTitle, editUrl);
    setEditErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      // All three fields are sent: an empty url or text clears it
      const updated = await updateInspiration(id, { title: editTitle, url: editUrl.trim(), text: editText });
      setInspirations((current) => current.map((inspiration) => (inspiration.id === id ? updated : inspiration)));
      setEditingId(null);
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    const errors = validate(title, url);
    setAddErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setSaving(true);
    try {
      // Empty fields are left out of the request
      const created = await createInspiration(projectId, {
        title,
        ...(url.trim() && { url: url.trim() }),
        ...(text.trim() && { text }),
      });
      setInspirations((current) => [...current, created]);
      setTitle("");
      setUrl("");
      setText("");
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setActionError(null);
    try {
      await deleteInspiration(id);
      setInspirations((current) => current.filter((inspiration) => inspiration.id !== id));
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <OverviewCard label="Inspiration">
      {loading && <p>Loading…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={refetch}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          {inspirations.length === 0 ? (
            <p>No inspiration yet.</p>
          ) : (
            <ul className={styles.list}>
              {inspirations.map((inspiration) =>
                inspiration.id === editingId ? (
                  <li key={inspiration.id} className={styles.listRow}>
                    <form onSubmit={(event) => handleSave(event, inspiration.id)} className={styles.inlineForm} noValidate>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Title *" aria-label="Title" maxLength={100} />
                      <FieldError message={editErrors.title} />
                      <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
                      <FieldError message={editErrors.url} />
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="Notes (optional)" aria-label="Notes" maxLength={2000} rows={3} />
                      <button type="submit" disabled={saving}>
                        {saving ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </form>
                  </li>
                ) : (
                  <li key={inspiration.id} className={styles.listRow}>
                    <div>
                      {inspiration.url && isHttpUrl(inspiration.url) ? (
                        <a href={inspiration.url} target="_blank" rel="noopener noreferrer">
                          {inspiration.title}
                        </a>
                      ) : (
                        <strong>{inspiration.title}</strong>
                      )}
                      {/* Rendered as text only (React escapes it) */}
                      {inspiration.text && <p>{inspiration.text}</p>}
                    </div>
                    <div className={styles.actions}>
                      <button type="button" onClick={() => startEdit(inspiration)}>
                        Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(inspiration.id)} aria-label={`Delete ${inspiration.title}`}>
                        ×
                      </button>
                    </div>
                  </li>
                ),
              )}
            </ul>
          )}

          <form onSubmit={handleAdd} className={styles.inlineForm} noValidate>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title *" aria-label="Title" maxLength={100} />
            <FieldError message={addErrors.title} />
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
            <FieldError message={addErrors.url} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Notes (optional)" aria-label="Notes" maxLength={2000} rows={3} />
            <button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add"}
            </button>
          </form>
          {actionError && <p role="alert">{actionError}</p>}
        </>
      )}
    </OverviewCard>
  );
}
