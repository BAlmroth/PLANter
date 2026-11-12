import { useColors } from "../colors/useColors";
import { createColor, linkColor, unlinkColor } from "../colors/colorsApi";
import { createItemDetail, deleteItemDetail, uploadItemDetailImage } from "../itemDetails/itemDetailsApi";
import type { useItemDetails } from "../itemDetails/useItemDetails";
import { ItemColorForm } from "./ItemColorForm";
import { MoodboardCard, type NewEntry } from "./MoodboardCard";

type Props = {
  projectId: string;
  itemId: string;
  // From useItemDetails in the parent, which also needs the rows (for the delete message)
  details: ReturnType<typeof useItemDetails>;
};

const messageFrom = (err: unknown) => (err instanceof Error ? err.message : "Something went wrong.");

// The moodboard of one item: its links, images and colors. It talks to the API and keeps the lists.
// The colors of the item come from the project's palette (an item only links to them).
export function ItemMoodboard({ projectId, itemId, details }: Props) {
  const palette = useColors(projectId);

  if (palette.loading) return <p>Loading moodboard…</p>;
  if (palette.error) {
    return (
      <div role="alert">
        <p>{palette.error}</p>
        <button type="button" onClick={palette.refetch}>
          Try again
        </button>
      </div>
    );
  }

  // The palette colors this item uses, and the ones it does not
  const usedIds = new Set(palette.links.filter((link) => link.itemId === itemId).map((link) => link.colorId));
  const itemColors = palette.colors.filter((color) => usedIds.has(color.id));
  const unused = palette.colors.filter((color) => !usedIds.has(color.id));

  // Two requests: the row is created first, then the image is attached to it.
  // If the image fails, the row stays and the card shows the error.
  async function addEntry(input: NewEntry, image: File | null) {
    const created = await createItemDetail(itemId, input);
    if (!image) {
      details.setDetails((current) => [...current, created]);
      return;
    }
    try {
      const withImage = await uploadItemDetailImage(created.id, image);
      details.setDetails((current) => [...current, withImage]);
    } catch (err) {
      details.setDetails((current) => [...current, created]);
      // cause: keeps the original error attached (for debugging), the card only shows the message
      throw new Error(`Added, but the image was not: ${messageFrom(err)}`, { cause: err });
    }
  }

  async function deleteEntry(id: string) {
    await deleteItemDetail(id);
    details.setDetails((current) => current.filter((row) => row.id !== id));
  }

  async function link(colorId: string) {
    await linkColor(itemId, colorId);
    palette.setLinks((current) => [...current, { itemId, colorId }]);
  }

  async function unlink(colorId: string) {
    await unlinkColor(itemId, colorId);
    palette.setLinks((current) => current.filter((l) => !(l.itemId === itemId && l.colorId === colorId)));
  }

  // A new color goes into the project's palette, and is linked to this item
  async function createAndLink(input: { hex: string; name?: string }) {
    const color = await createColor(projectId, input);
    palette.setColors((current) => [...current, color]);
    await link(color.id);
  }

  return (
    <MoodboardCard
      heading="Inspiration & Moodboard"
      entries={details.details}
      colors={itemColors}
      onAddEntry={addEntry}
      onDeleteEntry={deleteEntry}
      onRemoveColor={unlink}
      colorForm={<ItemColorForm unused={unused} onLink={link} onCreate={createAndLink} />}
    />
  );
}
