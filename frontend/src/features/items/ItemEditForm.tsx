import { useConfirm } from "../../components/useConfirm";
import { ItemForm } from "./ItemForm";
import { updateItem } from "./itemsApi";
import { messageFrom } from "./messageFrom";
import { getInvalidRelationshipCount } from "./typeChange";
import type { Item, Template, UpdateItemInput } from "./types";
import styles from "./ItemDetail.module.css";

type Props = {
  item: Item;
  template: Template;
  // Called with the saved item. The parent shows it and closes the form.
  onSaved: (saved: Item) => void;
  // Called when the server deleted connections because of a type change, so the parent loads them again
  onConnectionsRemoved: () => void;
  onCancel: () => void;
};

// The edit screen of an item: the form, and the extra question when a new type would break connections.
export function ItemEditForm({ item, template, onSaved, onConnectionsRemoved, onCancel }: Props) {
  const { confirm, modal } = useConfirm();

  return (
    <section className={styles.card}>
      {modal}
      <h2 className={styles.title}>Edit {item.title}</h2>
      <ItemForm
        types={template.itemTypes}
        showMvp
        initialValues={{
          title: item.title,
          description: item.description ?? "",
          type: item.type,
          isMvp: item.isMvp,
        }}
        submitLabel="Save changes"
        onCancel={onCancel}
        onSubmit={async ({ title, description, type, isMvp }) => {
          // "" clears the description, like for projects. The type is only sent when it changed.
          const changes: UpdateItemInput = {
            title,
            description,
            isMvp,
            ...(type !== item.type && { type }),
          };
          try {
            let saved: Item;
            try {
              saved = await updateItem(item.id, changes);
            } catch (err) {
              // 409: the new type would break some connections. Ask, then send again with the flag.
              const count = getInvalidRelationshipCount(err);
              if (count === null) throw err;
              const newLabel = template.itemTypes.find((t) => t.key === type)?.label ?? type;
              const what = count === 1 ? "1 connection that is" : `${count} connections that are`;
              if (!(await confirm({ title: "Change type?", message: `Changing the type to ${newLabel} deletes ${what} no longer allowed.`, confirmLabel: "Change type" }))) {
                return "The type was not changed.";
              }
              saved = await updateItem(item.id, { ...changes, confirmRelationshipRemoval: true });
              // The server deleted some connections, so the parent loads the list again
              onConnectionsRemoved();
            }
            onSaved(saved);
            return null;
          } catch (err) {
            return messageFrom(err);
          }
        }}
      />
    </section>
  );
}
