import { createInspiration, deleteInspiration, uploadInspirationImage } from "../inspirations/inspirationsApi";
import { useInspirations } from "../inspirations/useInspirations";
import { MoodboardCard, type NewEntry } from "../moodboard/MoodboardCard";
import { ProjectMoodboard } from "../moodboard/ProjectMoodboard";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

// The Moodboard page: the moodboard (colors, texts and images) on top, and the inspiration (links, texts and images) below.
// Both are rows in project_inspirations, told apart by their section.
export function InspirationPageCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch, setInspirations } = useInspirations(projectId);
  useGateLoading(loading);

  if (loading) return <Loader label="Loading…" size="section" />;
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

  // Two requests: the row first, then the image. If the image fails the row stays and the card shows the error.
  async function addEntry(input: NewEntry, image: File | null) {
    const created = await createInspiration(projectId, { ...input, section: "inspiration" });
    if (!image) {
      setInspirations((current) => [...current, created]);
      return;
    }
    try {
      const withImage = await uploadInspirationImage(created.id, image);
      setInspirations((current) => [...current, withImage]);
    } catch (err) {
      setInspirations((current) => [...current, created]);
      const reason = err instanceof Error ? err.message : "Something went wrong.";
      throw new Error(`Added, but the image was not: ${reason}`, { cause: err });
    }
  }

  async function deleteEntry(id: string) {
    await deleteInspiration(id);
    setInspirations((current) => current.filter((row) => row.id !== id));
  }

  return (
    <>
      <ProjectMoodboard
        projectId={projectId}
        entries={inspirations.filter((entry) => entry.section === "moodboard")}
        setInspirations={setInspirations}
      />
      <MoodboardCard
        heading="Inspiration"
        tourId="inspiration-card"
        entries={inspirations.filter((entry) => entry.section === "inspiration")}
        colors={[]}
        onAddEntry={addEntry}
        onDeleteEntry={deleteEntry}
        onRemoveColor={async () => {}}
      />
    </>
  );
}
