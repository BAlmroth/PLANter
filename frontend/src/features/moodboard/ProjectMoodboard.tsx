import { useState, type FormEvent } from "react";
import { useConfirm } from "../../components/useConfirm";
import { ApiError } from "../../lib/api";
import { createColor, deleteColor } from "../colors/colorsApi";
import { useColors } from "../colors/useColors";
import { createInspiration, deleteInspiration, uploadInspirationImage } from "../inspirations/inspirationsApi";
import type { Inspiration } from "../inspirations/types";
import { MoodboardCard, type NewEntry } from "./MoodboardCard";
import styles from "./MoodboardCard.module.css";

const messageFrom = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

type Props = {
  projectId: string;
  // The project's entries in the moodboard section, from useInspirations in the parent
  entries: Inspiration[];
  setInspirations: React.Dispatch<React.SetStateAction<Inspiration[]>>;
};

// The moodboard of the whole project: the color palette, texts and images.
// Texts and images are rows in project_inspirations (section "moodboard"), so no extra table is needed.
export function ProjectMoodboard({ projectId, entries, setInspirations }: Props) {
  const { colors, links, loading, error, refetch, setColors, setLinks } = useColors(projectId);
  const { confirm, modal } = useConfirm();

  // Two requests: the row first, then the image. If the image fails the row stays and the card shows the error.
  async function addEntry(input: NewEntry, image: File | null) {
    const created = await createInspiration(projectId, { ...input, section: "moodboard" });
    if (!image) {
      setInspirations((current) => [...current, created]);
      return;
    }
    try {
      const withImage = await uploadInspirationImage(created.id, image);
      setInspirations((current) => [...current, withImage]);
    } catch (err) {
      setInspirations((current) => [...current, created]);
      throw new Error(`Added, but the image was not: ${messageFrom(err)}`, { cause: err });
    }
  }

  async function deleteEntry(id: string) {
    await deleteInspiration(id);
    setInspirations((current) => current.filter((row) => row.id !== id));
  }

  async function removeColor(colorId: string) {
    const color = colors.find((c) => c.id === colorId);
    if (!color) return;
    // Say what else the delete does, like the item delete does
    const used = links.filter((link) => link.colorId === colorId).length;
    const alsoRemoves = used === 0 ? "" : ` It is used by ${used} ${used === 1 ? "item" : "items"} and is removed from them.`;
    if (!(await confirm({ title: "Delete color?", message: `${color.name ?? color.hex} will be deleted.${alsoRemoves}` }))) return;
    await deleteColor(colorId);
    setColors((current) => current.filter((c) => c.id !== colorId));
    setLinks((current) => current.filter((link) => link.colorId !== colorId));
  }

  async function addColor(input: { hex: string; name?: string }) {
    const color = await createColor(projectId, input);
    setColors((current) => [...current, color]);
  }

  if (loading) return <p>Loading moodboard…</p>;
  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={refetch}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <>
      {modal}
      <MoodboardCard
        heading="Moodboard"
        tourId="moodboard-card"
        entries={entries}
        colors={colors}
        onAddEntry={addEntry}
        onDeleteEntry={deleteEntry}
        onRemoveColor={removeColor}
        colorForm={<ProjectColorForm onCreate={addColor} />}
        allowUrl={false}
      />
    </>
  );
}

// The color form of the project: a new color goes into the palette
function ProjectColorForm({ onCreate }: { onCreate: (input: { hex: string; name?: string }) => Promise<void> }) {
  // The browser's color picker always gives "#rrggbb", which the backend accepts
  const [hex, setHex] = useState("#3e6554");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onCreate({ hex, ...(name.trim() && { name: name.trim() }) });
      setName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : messageFrom(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={styles.formButtons}>
      <input type="color" value={hex} onChange={(e) => setHex(e.target.value)} aria-label="New color" />
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Color name" maxLength={100} />
      <button type="submit" disabled={busy}>
        Add color
      </button>
      {error && <p role="alert" className={styles.error}>{error}</p>}
    </form>
  );
}
