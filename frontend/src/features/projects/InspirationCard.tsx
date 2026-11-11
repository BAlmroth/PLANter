import { useInspirations } from "../inspirations/useInspirations";
import { ProjectPalette } from "../moodboard/ProjectPalette";
import { OverviewCard } from "./OverviewCard";
import styles from "./ProjectOverview.module.css";

// How many entries the overview card lists, the rest is on the inspiration page
const INSPIRATION_LIMIT = 3;

// Summary of the project's moodboard on the overview (text titles and the color palette). A click opens the inspiration page.
// Not items, so they never count toward progress.
export function InspirationCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch } = useInspirations(projectId);
  // Only the moodboard's text entries: inspiration and images are left out of the overview
  const texts = inspirations.filter((entry) => entry.section === "moodboard" && !entry.imageUrl);

  return (
    <OverviewCard
      label="Moodboard & inspiration"
      to="moodboard"
      aside={!loading && !error && <span className={styles.meta}>{texts.length}</span>}
    >
      {loading && <p>Loading…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button type="button" onClick={refetch} className={styles.itemLink}>
            Try again
          </button>
        </div>
      )}
      {!loading && !error && texts.length > 0 && (
        <ul className={styles.list}>
          {texts.slice(0, INSPIRATION_LIMIT).map((entry) => (
            <li key={entry.id} className={`${styles.listRow} ${styles.oneLine}`}>
              {entry.title}
            </li>
          ))}
        </ul>
      )}
      <ProjectPalette projectId={projectId} editable={false} />
    </OverviewCard>
  );
}
