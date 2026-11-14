import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../items/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { useSprints } from "../sprints/useSprints";
import { tasksForScope } from "../tasks/boardColumns";
import { TaskBoard } from "../tasks/TaskBoard";
import { useTasks } from "../tasks/useTasks";
import { InspirationCard } from "./InspirationCard";
import { OverviewCard } from "./OverviewCard";
import { useProjectContext } from "./useProjectContext";
import styles from "./ProjectOverview.module.css";
import { Dropdown } from "../../components/Dropdown";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

// How many tech stack items the tech stack card lists
const TECH_LIMIT = 5;

// The first page of a project: cards with the description, inspiration, tech stack (top row) and the todo board with its sprints (bottom row).
// Every card is a summary: a click on it opens its own page, a click on an item opens the item.
export function ProjectOverview() {
  const { project } = useProjectContext();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const tasks = useTasks(project.id);
  const sprints = useSprints(project.id);
  // What the todo board shows: "all", "none" (no sprint) or a sprint id
  const [scope, setScope] = useState("all");

  // The tech stack card lists the items of the "tech_stack" category of the web template.
  // A template without that category just gets an empty card.
  const techItems = items.items.filter((item) => item.type === "tech_stack");
  const techLabel = template.template?.itemTypes.find((type) => type.key === "tech_stack")?.pluralLabel ?? "Tech stack";

  const pending = tasks.tasks.filter((task) => task.status !== "done");
  const tasksLoading = tasks.loading || sprints.loading;
  const tasksError = tasks.error ?? sprints.error;
  useGateLoading(template.loading || items.loading || tasksLoading);

  function tryAgain() {
    if (tasks.error) tasks.refetch();
    if (sprints.error) sprints.refetch();
  }

  // What the todo board can show: everything, one sprint with its progress, or the tasks without a sprint
  const scopeOptions = [
    { value: "all", label: "All tasks" },
    ...sprints.sprints.map((sprint) => {
      const sprintTasks = tasks.tasks.filter((task) => task.sprintId === sprint.id);
      const done = sprintTasks.filter((task) => task.status === "done").length;
      return { value: sprint.id, label: `${sprint.name} (${done} / ${sprintTasks.length} done)` };
    }),
    { value: "none", label: "No sprint" },
  ];

  return (
    <div className={styles.grid}>
      <OverviewCard label="description" to="description">
        <h3 className={styles.cardTitle}>{project.name}</h3>
        {/* "" and null both mean no description */}
        <p className={styles.clamp}>{project.description || "No description"}</p>
      </OverviewCard>

      <InspirationCard projectId={project.id} />

      <OverviewCard label={techLabel} to="plan?view=list">
        {items.loading ? (
          <Loader label="Loading…" size="inline" />
        ) : techItems.length === 0 ? (
          <p>No tech stack items yet.</p>
        ) : (
          <ul className={styles.list}>
            {techItems.slice(0, TECH_LIMIT).map((item) => (
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
        tourId="overview-todo"
        className={styles.full}
        aside={
          <span className={styles.todoAside}>
            {!tasksLoading && !tasksError && <span className={styles.meta}>{pending.length} pending</span>}
            <Link to="tasks" className={styles.itemLink}>
              Open Tasks &amp; sprints
            </Link>
          </span>
        }
      >
        {tasksLoading && <Loader label="Loading…" size="inline" />}
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
            {/* The sprint choice and its progress live here now, instead of in a card of their own */}
            <div className={styles.scope}>
              Show
              <Dropdown label="Show tasks of" value={scope} options={scopeOptions} onChange={setScope} />
            </div>
            <TaskBoard
              projectId={project.id}
              tasks={tasksForScope(tasks.tasks, scope)}
              items={items.items}
              sprints={sprints.sprints}
              template={template.template}
              setTasks={tasks.setTasks}
              compact
            />
          </>
        )}
      </OverviewCard>
    </div>
  );
}
