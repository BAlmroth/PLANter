import { useParams } from "react-router-dom";
import { ItemDetail } from "../features/items/ItemDetail";
import { useProjectContext } from "../features/projects/useProjectContext";

// The detail view of one item: /projects/:projectId/items/:itemId
// ProjectPage has already loaded the project, so it comes from the Outlet context,
// together with the project's warnings (the item shows its own).
export function ItemPage() {
  const { itemId } = useParams() as { itemId: string };
  const { project, warnings } = useProjectContext();
  const itemWarnings = warnings.byItem.get(itemId) ?? [];

  return <ItemDetail project={project} itemId={itemId} warnings={itemWarnings} refreshWarnings={warnings.refetch} />;
}
