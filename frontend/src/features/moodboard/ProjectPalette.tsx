import { useConfirm } from "../../components/useConfirm";
import { useState, type FormEvent } from "react";
import { ApiError } from "../../lib/api";
import { createColor, deleteColor } from "../colors/colorsApi";
import { isHexColor } from "../colors/isHexColor";
import type { ProjectColor } from "../colors/types";
import { useColors } from "../colors/useColors";
import styles from "./MoodboardCard.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

const messageFrom = (err: unknown) => (err instanceof ApiError ? err.message : "Something went wrong.");

// The project's color palette. With editable it also has add and delete (the Inspiration page),
// without it only shows the swatches (the overview card).
export function ProjectPalette({ projectId, editable }: { projectId: string; editable: boolean }) {
  const { colors, links, loading, error, refetch, setColors, setLinks } = useColors(projectId);
  useGateLoading(loading);
  // The browser's color picker always gives "#rrggbb", which the backend accepts
  const { confirm, modal } = useConfirm();
  const [hex, setHex] = useState("#3e6554");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // The read-only version stays quiet when there is nothing to show
  if (!editable && (loading || error || colors.length === 0)) return null;

  async function handleAdd(event: FormEvent) {
    event.preventDefault();
    setActionError(null);
    setBusy(true);
    try {
      const color = await createColor(projectId, { hex, ...(name.trim() && { name: name.trim() }) });
      setColors((current) => [...current, color]);
      setName("");
    } catch (err) {
      setActionError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(color: ProjectColor) {
    // Say what else the delete does, like the item delete does
    const used = links.filter((link) => link.colorId === color.id).length;
    const alsoRemoves = used === 0 ? "" : ` It is used by ${used} ${used === 1 ? "item" : "items"} and is removed from them.`;
    if (!(await confirm({ title: "Delete color?", message: `${color.name ?? color.hex} will be deleted.${alsoRemoves}` }))) return;
    setActionError(null);
    setBusy(true);
    try {
      await deleteColor(color.id);
      setColors((current) => current.filter((c) => c.id !== color.id));
      setLinks((current) => current.filter((link) => link.colorId !== color.id));
    } catch (err) {
      setActionError(messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {modal}
      <h3 className={styles.label}>Color palette</h3>
      {loading && <Loader label="Loading…" size="inline" />}
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
          {colors.length === 0 ? (
            <p>No colors yet.</p>
          ) : (
            <ul className={styles.swatches}>
              {colors.map((color) => (
                <li key={color.id} className={styles.swatch} title={color.name ?? undefined}>
                  {/* The color only reaches the style attribute when it is a valid #RRGGBB */}
                  <span className={styles.chip} style={isHexColor(color.hex) ? { background: color.hex } : undefined} />
                  <span className={styles.hex}>{color.hex}</span>
                  {editable && (
                    <button type="button" className={styles.remove} disabled={busy} onClick={() => handleDelete(color)} aria-label={`Delete ${color.name ?? color.hex}`}>
                      ×
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {editable && (
            <form onSubmit={handleAdd} className={styles.formButtons}>
              <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="New color" />
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Color name" maxLength={100} />
              <button type="submit" disabled={busy}>
                Add color
              </button>
            </form>
          )}
          {actionError && <p role="alert" className={styles.error}>{actionError}</p>}
        </>
      )}
    </div>
  );
}
