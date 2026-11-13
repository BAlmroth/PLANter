import { Link } from "react-router-dom";
import { GroupChips } from "../groups/GroupChip";
import { getGroupsOfItem } from "../groups/itemGroups";
import type { Group } from "../groups/types";
import { useGroups } from "../groups/useGroups";
import type { Project } from "../projects/types";
import { typeColorStyle } from "./typeColor";
import { StatusIcon } from "./StatusIcon";
import { useItems } from "./useItems";
import { useTemplate } from "./useTemplate";
import styles from "./FileSidebar.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

// The names of the groups an item is in, as a small line under its name. Nothing for an item in no group.
function GroupNames({ itemId, groups }: { itemId: string; groups: Group[] }) {
  const itemGroups = getGroupsOfItem(itemId, groups);
  if (itemGroups.length === 0) return null;
  return (
    <span className={styles.groups}>
      <GroupChips groups={itemGroups} />
    </span>
  );
}

// The short file list on the left of every project page: category, item name, groups and status.
// The full File view (descriptions and connections) is shown on /projects/:projectId/plan.
// It loads once and is not reloaded when the page changes. The refresh button loads it again,
// for example after an item was added on the map or a group was changed.
export function FileSidebar({ project }: { project: Project }) {
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const groups = useGroups(project.id);

  const loading = template.loading || items.loading || groups.loading;
  useGateLoading(loading);
  const error = template.error ?? items.error ?? groups.error;

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (groups.error) groups.refetch();
  }

  function refresh() {
    items.refetch();
    groups.refetch();
  }

  if (loading) return <Loader label="Loading items…" size="section" />;

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

  // After the check above TypeScript knows the template is loaded
  const loadedTemplate = template.template;

  // Items whose type is not in the template (for example an old key) go under "Unknown"
  const knownKeys = loadedTemplate.itemTypes.map((type) => type.key);
  const categories = [
    ...loadedTemplate.itemTypes.map((type) => ({
      key: type.key,
      label: type.pluralLabel,
      items: items.items.filter((item) => item.type === type.key),
    })),
    { key: "unknown", label: "Unknown", items: items.items.filter((item) => !knownKeys.includes(item.type)) },
  ];

  return (
    <nav aria-label="Items">
      <div className={styles.heading}>
        <Link to={`/projects/${project.id}/plan?view=list`} className={styles.headingLink}>
          Item Overview<span className={styles.count}>{items.items.length} items </span>
        </Link>
        <button type="button" className={styles.refresh} onClick={refresh} aria-label="Refresh item list" title="Refresh">
          ↻
        </button>
      </div>
      {categories
        // Hide "Unknown" when there is nothing in it
        .filter((category) => category.key !== "unknown" || category.items.length > 0)
        .map((category) => (
          // The key is the type key ("unknown" matches no type, so it stays grey)
          <section key={category.key} className={styles.group} style={typeColorStyle(loadedTemplate, category.key)}>
            <h2 className={styles.groupTitle}>{category.label}</h2>
            {category.items.length === 0 ? (
              <p className={styles.empty}>No items yet.</p>
            ) : (
              <ul className={styles.list}>
                {category.items.map((item) => (
                  <li key={item.id}>
                    <Link to={`/projects/${project.id}/items/${item.id}`} className={styles.row}>
                      <span className={styles.name}>
                        {item.title}
                        <GroupNames itemId={item.id} groups={groups.groups} />
                      </span>
                      <StatusIcon status={item.status} />
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
