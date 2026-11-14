import { useState } from "react";
import type { Item, Template } from "../items/types";
import { typeColorStyle } from "../items/typeColor";
import styles from "../items/ItemDetail.module.css";
import { InfoBubble } from "../../components/InfoBubble";

// Shown in the "i" next to the heading. The tour step for this card says the same thing in short.
const REQUIREMENTS_HELP =
  "What it takes to get this item: what it is made from, what it costs or what unlocks it, with amounts. Conditions are requirements that are not items, like “only in summer”.";
import { ConnectExistingForm } from "../relationships/ConnectExistingForm";
import { ConnectedItemForm } from "../relationships/ConnectedItemForm";
import type { ConnectOption, Connection } from "../relationships/connections";
import { connectionText } from "../relationships/quantity";
import { AmountEditor } from "./AmountEditor";
import { ConditionsEditor } from "./ConditionsEditor";
import type { RequirementRow } from "./requirements";

type Props = {
  item: Item;
  template: Template;
  allItems: Item[];
  // From getRequirementRows. The parent does not render the card when there are none.
  rows: RequirementRow[];
  busy: boolean;
  onRemove: (connection: Connection) => void;
  onAddConnectedItem: (option: ConnectOption, title: string, quantity: number | undefined) => Promise<string | null>;
  onConnectExisting: (option: ConnectOption, otherItemId: string, quantity: number | undefined) => Promise<string | null>;
  // Returns an error message, or null when it worked
  onChangeAmount: (connectionId: string, quantity: number | null) => Promise<string | null>;
  // Saves the item's conditions text ("" clears it). Returns an error message, or null when it worked.
  onChangeConditions: (conditions: string) => Promise<string | null>;
};

// Which "+ Add" form is open: for which row, and picking an existing item or creating a new one
type Adding = { relationshipType: string; mode: "existing" | "new" };

// "What does it take to get this item?": recipes, prices and what unlocks it, one row each.
// Every entry is an ordinary connection, so it also shows on the map and on the other item.
// The parent only shows this card when the template has requirement types for the item's category
// (never in the web template).
export function RequirementsCard({
  item, template, allItems, rows, busy, onRemove, onAddConnectedItem, onConnectExisting, onChangeAmount, onChangeConditions,
}: Props) {
  const [adding, setAdding] = useState<Adding | null>(null);
  // The connection whose amount is being edited
  const [editingId, setEditingId] = useState<string | null>(null);

  const addingRow = rows.find((row) => row.relationshipType === adding?.relationshipType);
  const others = allItems.filter((other) => other.id !== item.id);

  // Start with "pick an existing item" when there is one to pick, otherwise with "create a new one"
  function startAdding(row: RequirementRow) {
    const canPick = others.some((other) => row.options.some((option) => option.newItemType === other.type));
    setAdding({ relationshipType: row.relationshipType, mode: canPick ? "existing" : "new" });
    setEditingId(null);
  }

  // The forms report back the same way as on the Connections card: null = done, so close the form
  async function closeOnSuccess(request: Promise<string | null>) {
    const message = await request;
    if (message === null) setAdding(null);
    return message;
  }

  return (
    <section className={styles.card} aria-labelledby="requirements-title" data-tour="item-requirements">
      {/* The "i" sits next to the heading, not inside it, so the heading's name stays "Requirements" */}
      <div className={styles.cardTitleRow}>
        <h2 id="requirements-title" className={styles.cardTitle}>Requirements</h2>
        <InfoBubble text={REQUIREMENTS_HELP} label="About requirements" />
      </div>
      <div className={styles.relationGroups}>
        {rows.map((row) => (
          <div key={row.relationshipType} className={styles.relationGroup}>
            <h3 className={styles.label}>{row.label}</h3>
            {row.entries.length === 0 ? (
              <p className={styles.empty}>Nothing yet.</p>
            ) : (
              <ul className={styles.pills}>
                {row.entries.map((entry) =>
                  editingId === entry.id ? (
                    <li key={entry.id}>
                      <AmountEditor
                        current={entry.amount?.value ?? null}
                        onCancel={() => setEditingId(null)}
                        onSave={async (quantity) => {
                          const message = await onChangeAmount(entry.id, quantity);
                          if (message === null) setEditingId(null);
                          return message;
                        }}
                      />
                    </li>
                  ) : (
                    <li key={entry.id} className={styles.pill} style={typeColorStyle(template, entry.otherType)}>
                      {/* "20 × Wood" when it has an amount, otherwise just the title */}
                      {connectionText(entry)}
                      {/* The type label is shown next to the colored dot, so color never stands alone */}
                      <span className={styles.pillType}>
                        {template.itemTypes.find((t) => t.key === entry.otherType)?.label ?? "Unknown"}
                      </span>
                      {row.hasQuantity && (
                        <button
                          type="button"
                          className={styles.editAmount}
                          onClick={() => {
                            setEditingId(entry.id);
                            setAdding(null);
                          }}
                          disabled={busy}
                          aria-label={`Edit the amount of ${entry.otherTitle}`}
                        >
                          {entry.amount ? "Edit amount" : "Add amount"}
                        </button>
                      )}
                      <button
                        type="button"
                        className={styles.remove}
                        onClick={() => onRemove(entry)}
                        disabled={busy}
                        aria-label={`Remove the requirement ${entry.label}: ${connectionText(entry)}`}
                      >
                        ×
                      </button>
                    </li>
                  ),
                )}
              </ul>
            )}
            {adding?.relationshipType !== row.relationshipType && (
              <p>
                <button type="button" className={styles.secondary} onClick={() => startAdding(row)} disabled={busy}>
                  + Add
                </button>
              </p>
            )}
          </div>
        ))}
        {/* Not a connection: what is needed but is not an item ("only in summer") */}
        <div className={styles.relationGroup}>
          <h3 className={styles.label}>Conditions</h3>
          <ConditionsEditor conditions={item.conditions} busy={busy} onSave={onChangeConditions} />
        </div>
      </div>

      {/* Below the rows, full width: the same forms as on the Connections card, limited to one type */}
      {adding && addingRow && (
        <>
          {adding.mode === "existing" ? (
            // key: a fresh form (no leftover choices) for every row
            <ConnectExistingForm
              key={adding.relationshipType}
              thisTitle={item.title}
              options={addingRow.options}
              items={others}
              onCancel={() => setAdding(null)}
              onSubmit={(option, otherItemId, quantity) => closeOnSuccess(onConnectExisting(option, otherItemId, quantity))}
            />
          ) : (
            <ConnectedItemForm
              key={adding.relationshipType}
              thisTitle={item.title}
              options={addingRow.options}
              onCancel={() => setAdding(null)}
              onSubmit={(option, title, quantity) => closeOnSuccess(onAddConnectedItem(option, title, quantity))}
            />
          )}
          <p>
            <button
              type="button"
              className={styles.secondary}
              onClick={() => setAdding({ ...adding, mode: adding.mode === "existing" ? "new" : "existing" })}
            >
              {adding.mode === "existing" ? "Create a new one instead" : "Pick an existing one instead"}
            </button>
          </p>
        </>
      )}
    </section>
  );
}
