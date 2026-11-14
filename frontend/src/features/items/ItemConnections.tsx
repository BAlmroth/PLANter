import { useState } from "react";
import { ConnectExistingForm } from "../relationships/ConnectExistingForm";
import { ConnectedItemForm } from "../relationships/ConnectedItemForm";
import { groupConnectionsByLabel, type ConnectOption, type Connection } from "../relationships/connections";
import type { Item, Template } from "./types";
import { typeColorStyle } from "./typeColor";
import styles from "./ItemDetail.module.css";

type Props = {
  item: Item;
  template: Template;
  // All items of the project, for the "Connect existing item" form
  allItems: Item[];
  connections: Connection[];
  connectOptions: ConnectOption[];
  // true while a request in the parent is running
  busy: boolean;
  onRemove: (connection: Connection) => void;
  // Both return an error message, or null when it worked
  onAddConnectedItem: (option: ConnectOption, title: string) => Promise<string | null>;
  onConnectExisting: (option: ConnectOption, otherItemId: string) => Promise<string | null>;
};

// The "Connections" card on the item page: the connections as pills, and the two forms to add one.
// The requests themselves live in ItemDetail, because they also update items, relationships and warnings.
export function ItemConnections({
  item,
  template,
  allItems,
  connections,
  connectOptions,
  busy,
  onRemove,
  onAddConnectedItem,
  onConnectExisting,
}: Props) {
  // Which connect form is open: a new item, an existing item, or none
  const [connecting, setConnecting] = useState<"new" | "existing" | null>(null);

  return (
    <section className={styles.card} data-tour="item-connections">
      <h2 className={styles.cardTitle}>Connections</h2>
      {connections.length === 0 ? (
        <p className={styles.empty}>No connections yet.</p>
      ) : (
        // One box per kind of connection ("uses", "used by", …), with the other items as pills
        <div className={styles.relationGroups}>
          {groupConnectionsByLabel(connections).map((group) => (
            <div key={group.label} className={styles.relationGroup}>
              <h3 className={styles.label}>{group.label}</h3>
              <ul className={styles.pills}>
                {group.connections.map((connection) => (
                  <li key={connection.id} className={styles.pill} style={typeColorStyle(template, connection.otherType)}>
                    {connection.otherTitle}
                    {/* The type label is shown next to the colored dot, so color never stands alone */}
                    <span className={styles.pillType}>
                      {template.itemTypes.find((t) => t.key === connection.otherType)?.label ?? "Unknown"}
                    </span>
                    <button
                      type="button"
                      className={styles.remove}
                      onClick={() => onRemove(connection)}
                      disabled={busy}
                      aria-label={`Remove the connection ${connection.label}: ${connection.otherTitle}`}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {connectOptions.length > 0 &&
        (connecting === "new" ? (
          <ConnectedItemForm
            thisTitle={item.title}
            options={connectOptions}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, title) => {
              const message = await onAddConnectedItem(option, title);
              if (message === null) setConnecting(null);
              return message;
            }}
          />
        ) : connecting === "existing" ? (
          <ConnectExistingForm
            thisTitle={item.title}
            options={connectOptions}
            items={allItems.filter((other) => other.id !== item.id)}
            onCancel={() => setConnecting(null)}
            onSubmit={async (option, otherItemId) => {
              const message = await onConnectExisting(option, otherItemId);
              if (message === null) setConnecting(null);
              return message;
            }}
          />
        ) : (
          <div className={styles.actions}>
            <button type="button" className={styles.secondary} onClick={() => setConnecting("new")} disabled={busy}>
              + Add connected item
            </button>
            <button type="button" className={styles.secondary} onClick={() => setConnecting("existing")} disabled={busy}>
              Connect existing item
            </button>
          </div>
        ))}
    </section>
  );
}
