import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../items/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { useSprints } from "../sprints/useSprints";
import { useTasks } from "../tasks/useTasks";
import { OverviewCard } from "./OverviewCard";
import { useProjectContext } from "./useProjectContext";
import styles from "./ProjectOverview.module.css";

// How many pending tasks the todo card lists
const TODO_LIMIT = 5;

// The first page of a project: cards with the description, tech stack, todo list and sprints.
// Every card is a summary: a click on it opens its own page, a click on an item opens the item.
export function ProjectOverview() {
  const { project } = useProjectContext();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const tasks = useTasks(project.id);
  const sprints = useSprints(project.id);

  // The tech stack card lists the items of the "tech_stack" category of the web template.
  // A template without that category just gets an empty card.
  const techItems = items.items.filter((item) => item.type === "tech_stack");
  const techLabel = template.template?.itemTypes.find((type) => type.key === "tech_stack")?.pluralLabel ?? "Tech stack";

  const pending = tasks.tasks.filter((task) => !task.done);
  const tasksLoading = tasks.loading || sprints.loading;
  const tasksError = tasks.error ?? sprints.error;

  function tryAgain() {
    if (tasks.error) tasks.refetch();
    if (sprints.error) sprints.refetch();
  }

  return (
    <div className={styles.grid}>
      <OverviewCard label="Desc" to="description" className={styles.wide}>
        <h3 className={styles.cardTitle}>{project.name}</h3>
        {/* "" and null both mean no description */}
        <p className={styles.clamp}>{project.description || "No description"}</p>
      </OverviewCard>

      <OverviewCard label={techLabel} to="files">
        {items.loading ? (
          <p>Loading…</p>
        ) : techItems.length === 0 ? (
          <p>No tech stack items yet.</p>
        ) : (
          <ul className={styles.list}>
            {techItems.map((item) => (
              <li key={item.id} className={styles.listRow}>
                <Link to={`items/${item.id}`} className={styles.itemLink}>
                  {item.title}
                </Link>
                <span className={styles.meta}>{STATUS_LABELS[item.status]}</span>
              </li>
            ))}
          </ul>
        )}
      </OverviewCard>

      <OverviewCard
        label="Todo"
        to="tasks"
        className={styles.wide}
        aside={!tasksLoading && !tasksError && <span className={styles.meta}>{pending.length} pending</span>}
      >
        {tasksLoading && <p>Loading…</p>}
        {tasksError && (
          <div role="alert">
            <p>{tasksError}</p>
            <button type="button" onClick={tryAgain} className={styles.itemLink}>
              Try again
            </button>
          </div>
        )}
        {!tasksLoading && !tasksError && (
          <>
            {pending.length === 0 ? (
              <p>Nothing left to do.</p>
            ) : (
              <ul className={styles.list}>
                {pending.slice(0, TODO_LIMIT).map((task) => (
                  <li key={task.id} className={styles.listRow}>
                    {task.itemId ? (
                      <Link to={`items/${task.itemId}`} className={styles.itemLink}>
                        {task.title}
                      </Link>
                    ) : (
                      task.title
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </OverviewCard>

      <OverviewCard label="Sprint" to="tasks">
        {tasksLoading && <p>Loading…</p>}
        {!tasksLoading && !tasksError && sprints.sprints.length === 0 && <p>No sprints yet.</p>}
        {!tasksLoading && !tasksError && (
          <ul className={styles.list}>
            {sprints.sprints.map((sprint) => {
              const sprintTasks = tasks.tasks.filter((task) => task.sprintId === sprint.id);
              const done = sprintTasks.filter((task) => task.done).length;
              return (
                <li key={sprint.id} className={styles.listRow}>
                  {sprint.name}
                  <span className={styles.meta}>
                    {done} / {sprintTasks.length} done
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </OverviewCard>
    </div>
  );
}
