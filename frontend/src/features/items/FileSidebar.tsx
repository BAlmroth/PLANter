import { Link } from "react-router-dom";
import type { Project } from "../projects/types";
import { STATUS_LABELS } from "./types";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./FileSidebar.module.css";

// The short file list on the left of every project page: category, item name and status.
// The full File view (descriptions and connections) is its own page, /projects/:projectId/files.
// It loads once and is not reloaded when the page changes. The refresh button loads it again,
// for example after an item was added on the map.
export function FileSidebar({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);

  const loading = template.loading || items.loading;
  const error = template.error ?? items.error;

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
  }

  if (loading) return <p>Loading items…</p>;

  if (error || !template.template) {
    return (
      <div role="alert">
        <p>{error ?? "Something went wrong."}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  // Items whose type is not in the template (for example an old key) go under "Unknown"
  const knownKeys = template.template.itemTypes.map((type) => type.key);
  const groups = [
    ...template.template.itemTypes.map((type) => ({
      key: type.key,
      label: type.pluralLabel,
      items: items.items.filter((item) => item.type === type.key),
    })),
    { key: "unknown", label: "Unknown", items: items.items.filter((item) => !knownKeys.includes(item.type)) },
  ];

  return (
    <nav aria-label="Files">
      <div className={styles.heading}>
        <Link to={`/projects/${project.id}/files`} className={styles.headingLink}>
          File <span className={styles.count}>{items.items.length} items</span>
        </Link>
        <button type="button" className={styles.refresh} onClick={items.refetch} aria-label="Refresh file list" title="Refresh">
          ↻
        </button>
      </div>
      {groups
        // Hide "Unknown" when there is nothing in it
        .filter((group) => group.key !== "unknown" || group.items.length > 0)
        .map((group) => (
          <section key={group.key} className={styles.group}>
            <h2 className={styles.groupTitle}>{group.label}</h2>
            {group.items.length === 0 ? (
              <p className={styles.empty}>No items yet.</p>
            ) : (
              <ul className={styles.list}>
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link to={`/projects/${project.id}/items/${item.id}`} className={styles.row}>
                      <span>{item.title}</span>
                      <span className={styles.status}>{STATUS_LABELS[item.status]}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
    </nav>
  );
}
