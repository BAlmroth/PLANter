import { useInspirations } from "../inspirations/useInspirations";
import { ProjectPalette } from "../moodboard/ProjectPalette";
import { OverviewCard } from "./OverviewCard";
import { isHttpUrl } from "./isHttpUrl";
import styles from "./ProjectOverview.module.css";

// How many entries the overview card lists, the rest is on the inspiration page
const INSPIRATION_LIMIT = 5;

// Summary of the project's inspiration on the overview. A click opens the inspiration page.
// Not items, so they never count toward progress.
export function InspirationCard({ projectId }: { projectId: string }) {
  const { inspirations, loading, error, refetch } = useInspirations(projectId);

  return (
    <OverviewCard
      label="Moodboard & inspiration"
      to="moodboard"
      aside={!loading && !error && <span className={styles.meta}>{inspirations.length}</span>}
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
      {!loading && !error && (inspirations.length === 0 ? (
        <p>No inspiration yet.</p>
      ) : (
        <ul className={styles.list}>
          {inspirations.slice(0, INSPIRATION_LIMIT).map((inspiration) => (
            <li key={inspiration.id} className={styles.listRow}>
              {inspiration.url && isHttpUrl(inspiration.url) ? (
                <a href={inspiration.url} target="_blank" rel="noopener noreferrer" className={styles.itemLink}>
                  {inspiration.title}
                </a>
              ) : (
                inspiration.title
              )}
            </li>
          ))}
        </ul>
      ))}
      <ProjectPalette projectId={projectId} editable={false} />
    </OverviewCard>
  );
}
