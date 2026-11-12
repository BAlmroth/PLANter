import type { ReactNode } from "react";
import { ChipInput } from "../../components/ChipInput";
import type { Template } from "../items/types";
import { typeColorVar } from "../items/typeColor";
import { MAX_ENTRIES, addEntry, itemCount, type Starter } from "./starter";
import styles from "./StarterForm.module.css";

type Props = {
  template: Template;
  starter: Starter;
  setStarter: (update: (current: Starter) => Starter) => void;
};

// Step 2 of the new-project page: one collapsible section per category (from the template),
// plus groups and first tasks. Everything is optional.
export function StarterForm({ template, starter, setStarter }: Props) {
  // All item types share one limit of 50, like the backend
  const itemsFull = itemCount(starter) >= MAX_ENTRIES;

  function setItems(typeKey: string, update: (names: string[]) => string[]) {
    setStarter((current) => ({
      ...current,
      items: { ...current.items, [typeKey]: update(current.items[typeKey] ?? []) },
    }));
  }

  return (
    <div className={styles.sections}>
      {template.itemTypes.map((type, index) => {
        const names = starter.items[type.key] ?? [];
        return (
          <Section
            key={type.key}
            title={type.pluralLabel}
            count={names.length}
            color={type.color}
            // Pages are where most plans start, so the first category is open
            defaultOpen={index === 0}
          >
            <p className={styles.help}>{type.description}</p>
            <ChipInput
              label={`Add ${type.label.toLowerCase()}`}
              values={names}
              placeholder={`e.g. ${type.example}`}
              disabled={itemsFull}
              style={typeColorVar(type.color)}
              onAdd={(text) => setItems(type.key, (list) => addEntry(list, text))}
              onRemove={(i) => setItems(type.key, (list) => list.filter((_, j) => j !== i))}
            />
          </Section>
        );
      })}
      {itemsFull && (
        <p className={styles.help}>
          That is {MAX_ENTRIES} items, the most you can add here. Add the rest in the project.
        </p>
      )}

      <Section title="Groups" count={starter.groups.length}>
        <p className={styles.help}>
          Items that belong together across categories, for example everything for the checkout.
        </p>
        <ChipInput
          label="Add a group"
          values={starter.groups}
          placeholder="e.g. Navigation, Checkout"
          onAdd={(text) => setStarter((s) => ({ ...s, groups: addEntry(s.groups, text) }))}
          onRemove={(i) => setStarter((s) => ({ ...s, groups: s.groups.filter((_, j) => j !== i) }))}
        />
      </Section>

      <Section title="First tasks" count={starter.tasks.length}>
        <p className={styles.help}>Concrete to-dos you already know about. You can sort them into sprints later.</p>
        <ChipInput
          label="Add a task"
          values={starter.tasks}
          placeholder="e.g. Set up the repo, Make wireframes"
          onAdd={(text) => setStarter((s) => ({ ...s, tasks: addEntry(s.tasks, text) }))}
          onRemove={(i) => setStarter((s) => ({ ...s, tasks: s.tasks.filter((_, j) => j !== i) }))}
        />
      </Section>
    </div>
  );
}

type SectionProps = {
  title: string;
  count: number;
  // The item type's color for the dot. Groups and tasks have none.
  color?: string;
  defaultOpen?: boolean;
  children: ReactNode;
};

// <details> opens and closes by itself (and with the keyboard), so no state is needed.
// The count stays visible when the section is closed.
function Section({ title, count, color, defaultOpen = false, children }: SectionProps) {
  return (
    <details className={styles.section} open={defaultOpen} style={typeColorVar(color)}>
      <summary className={styles.summary}>
        {color && <span className={styles.dot} aria-hidden="true" />}
        <span className={styles.title}>{title}</span>
        {count > 0 && <span className={styles.count}>{count}</span>}
      </summary>
      <div className={styles.body}>{children}</div>
    </details>
  );
}
