import { useState } from "react";
import { Link } from "react-router-dom";
import { STATUS_LABELS } from "../items/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { useSprints } from "../sprints/useSprints";
import { tasksForScope } from "../tasks/boardColumns";
import { NewTaskForm } from "../tasks/NewTaskForm";
import { TaskBoard } from "../tasks/TaskBoard";
import { useTasks } from "../tasks/useTasks";
import { InspirationCard } from "./InspirationCard";
import { OverviewCard } from "./OverviewCard";
import { useProjectContext } from "./useProjectContext";
import styles from "./ProjectOverview.module.css";
import { Dropdown } from "../../components/Dropdown";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";

// How many items the extra overview card (tech stack in the web template) lists
const CARD_LIMIT = 5;

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
  // The New task form above the board
  const [addingTask, setAddingTask] = useState(false);

  // The extra card lists the items of the category the template marks with `overviewCard`
  // (the web template: tech stack). A template with no such category gets no card.
  const cardType = template.template?.itemTypes.find((type) => type.overviewCard);
  const cardItems = cardType ? items.items.filter((item) => item.type === cardType.key) : [];

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

      {cardType && (
        <OverviewCard label={cardType.pluralLabel} to="plan?view=list">
          {items.loading ? (
            <Loader label="Loading…" size="inline" />
          ) : cardItems.length === 0 ? (
            <p>No {cardType.pluralLabel.toLowerCase()} items yet.</p>
          ) : (
            <ul className={styles.list}>
              {cardItems.slice(0, CARD_LIMIT).map((item) => (
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
      )}

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
            {!tasksLoading && !tasksError && (
              <button
                type="button"
                aria-expanded={addingTask}
                aria-controls="overview-new-task"
                onClick={() => setAddingTask((open) => !open)}
              >
                {addingTask ? "Close new task" : "+ New task"}
              </button>
            )}
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
            {addingTask && (
              <div id="overview-new-task" className={styles.newTask}>
                {/* key: when another sprint is chosen the form starts again with that sprint selected */}
                <NewTaskForm
                  key={scope}
                  projectId={project.id}
                  items={items.items}
                  sprints={sprints.sprints}
                  defaultSprintId={scope !== "all" && scope !== "none" ? scope : ""}
                  onCreated={(task) => tasks.setTasks((current) => [...current, task])}
                />
              </div>
            )}
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
