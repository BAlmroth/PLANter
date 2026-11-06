import { useState } from "react";
import type { FormEvent } from "react";
import { ApiError } from "../../lib/api";
import { IMAGE_TYPES, imageProblem } from "../../lib/imageFile";
import {
  createInspiration,
  deleteInspiration,
  updateInspiration,
  uploadInspirationImage,
} from "../inspirations/inspirationsApi";
import type { Inspiration } from "../inspirations/types";
import { useInspirations } from "../inspirations/useInspirations";
import { ProjectPalette } from "../moodboard/ProjectPalette";
import { OverviewCard } from "./OverviewCard";
import { isHttpUrl } from "./isHttpUrl";
import styles from "./ProjectOverview.module.css";

// The Inspiration page: all links, notes and images of the project, with add, edit and delete, and the color palette
export function InspirationPageCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch, setInspirations } = useInspirations(projectId);
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  // The chosen image files. A file input cannot be cleared from React, so changing its key makes a fresh one.
  const [image, setImage] = useState<File | null>(null);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // The entry being edited (one at a time) and the values in its form
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editText, setEditText] = useState("");

  function startEdit(inspiration: Inspiration) {
    setActionError(null);
    setEditingId(inspiration.id);
    setEditTitle(inspiration.title);
    setEditUrl(inspiration.url ?? "");
    setEditText(inspiration.text ?? "");
    setEditImage(null);
  }

  // Runs when a file is chosen. A bad file is refused right away.
  function pickImage(file: File | undefined, set: (file: File | null) => void) {
    if (file) {
      const problem = imageProblem(file);
      if (problem) {
        setActionError(problem);
        setFileInputKey((key) => key + 1);
        set(null);
        return;
      }
    }
    setActionError(null);
    set(file ?? null);
  }

  async function handleSave(event: FormEvent, id: string) {
    event.preventDefault();
    setActionError(null);
    setSaving(true);
    try {
      // All three fields are sent: an empty url or text clears it
      let updated = await updateInspiration(id, { title: editTitle, url: editUrl.trim(), text: editText });
      setInspirations((current) => current.map((inspiration) => (inspiration.id === id ? updated : inspiration)));
      setEditingId(null);
      // The text is saved first. If the image fails, the user keeps the text changes.
      if (editImage) {
        try {
          updated = await uploadInspirationImage(id, editImage);
          setInspirations((current) => current.map((inspiration) => (inspiration.id === id ? updated : inspiration)));
        } catch (err) {
          const reason = err instanceof ApiError ? err.message : "Something went wrong.";
          setActionError(`Changes were saved, but the image was not: ${reason}`);
        }
      }
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    setSaving(true);
    try {
      // Empty fields are left out of the request
      const created = await createInspiration(projectId, {
        title,
        ...(url.trim() && { url: url.trim() }),
        ...(text.trim() && { text }),
      });
      let entry = created;
      // Two requests: the entry exists first, then the image is attached to it
      if (image) {
        try {
          entry = await uploadInspirationImage(created.id, image);
        } catch (err) {
          const reason = err instanceof ApiError ? err.message : "Something went wrong.";
          setActionError(`Inspiration was added, but the image was not: ${reason}`);
        }
      }
      setInspirations((current) => [...current, entry]);
      setTitle("");
      setUrl("");
      setText("");
      setImage(null);
      setFileInputKey((key) => key + 1);
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
                    <form onSubmit={(event) => handleSave(event, inspiration.id)} className={styles.inlineForm}>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} aria-label="Title" required maxLength={100} />
                      <input type="url" value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
                      <textarea value={editText} onChange={(e) => setEditText(e.target.value)} placeholder="Notes (optional)" aria-label="Notes" maxLength={2000} rows={3} />
                      <input
                        key={fileInputKey}
                        type="file"
                        accept={IMAGE_TYPES.join(",")}
                        onChange={(e) => pickImage(e.target.files?.[0], setEditImage)}
                        aria-label={inspiration.imageUrl ? "Replace image" : "Image"}
                      />
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
                      {inspiration.imageUrl && isHttpUrl(inspiration.imageUrl) && (
                        <img src={inspiration.imageUrl} alt={inspiration.title} className={styles.inspirationImage} />
                      )}
                      {/* Rendered as text only (React escapes it). For an image this is its description. */}
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

          <form onSubmit={handleAdd} className={styles.inlineForm}>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" aria-label="Title" required maxLength={100} />
            <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://… (optional)" aria-label="Link" maxLength={2000} />
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Notes or image description (optional)" aria-label="Notes" maxLength={2000} rows={3} />
            <input
              key={fileInputKey}
              type="file"
              accept={IMAGE_TYPES.join(",")}
              onChange={(e) => pickImage(e.target.files?.[0], setImage)}
              aria-label="Image"
            />
            <button type="submit" disabled={saving}>
              {saving ? "Adding…" : "Add"}
            </button>
          </form>
          {actionError && <p role="alert">{actionError}</p>}
        </>
      )}
      <ProjectPalette projectId={projectId} editable />
    </OverviewCard>
  );
}
