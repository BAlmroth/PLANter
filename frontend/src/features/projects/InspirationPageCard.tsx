import { createInspiration, deleteInspiration } from "../inspirations/inspirationsApi";
import { useInspirations } from "../inspirations/useInspirations";
import { MoodboardCard, type NewEntry } from "../moodboard/MoodboardCard";
import { ProjectMoodboard } from "../moodboard/ProjectMoodboard";

// The Moodboard page: the moodboard (colors, texts and images) on top, and the inspiration (links with notes) below.
// Both are rows in project_inspirations: a row with a link is inspiration, the others belong to the moodboard.
export function InspirationPageCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch, setInspirations } = useInspirations(projectId);

  if (loading) return <p>Loading…</p>;
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

  async function addLink(input: NewEntry) {
    const created = await createInspiration(projectId, input);
    setInspirations((current) => [...current, created]);
  }

  async function deleteLink(id: string) {
    await deleteInspiration(id);
    setInspirations((current) => current.filter((row) => row.id !== id));
  }

  return (
    <>
      <ProjectMoodboard
        projectId={projectId}
        entries={inspirations.filter((entry) => !entry.url)}
        setInspirations={setInspirations}
      />
      <MoodboardCard
        heading="Inspiration"
        entries={inspirations.filter((entry) => entry.url)}
        colors={[]}
        onAddEntry={addLink}
        onDeleteEntry={deleteLink}
        onRemoveColor={async () => {}}
        allowImage={false}
      />
    </>
  );
}
