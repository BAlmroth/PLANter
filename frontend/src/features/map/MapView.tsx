import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Background, Controls, ReactFlow, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { useRelationships } from "../relationships/useRelationships";
import { ItemNode } from "./ItemNode";
import type { ItemNodeType } from "./mockData";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// Space between nodes when an item has no saved position yet
const COLUMN_WIDTH = 220;
const ROW_HEIGHT = 110;

// The relationship map: items as nodes, relationships as arrows. Read-only for now.
// Click a node to open the item's detail view.
export function MapView({ project }: { project: Project }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);

  const loading = template.loading || items.loading || relationships.loading;
  const error = template.error ?? items.error ?? relationships.error;

  // Rebuilt only when the data changes, not on every render
  const { nodes, edges } = useMemo(() => {
    if (!template.template) return { nodes: [], edges: [] };
    const itemTypes = template.template.itemTypes;

    // How many items of each type we have placed so far (for the row)
    const placed: Record<string, number> = {};

    const nodes: ItemNodeType[] = items.items.map((item) => {
      const column = Math.max(
        0,
        itemTypes.findIndex((type) => type.key === item.type),
      );
      const row = placed[item.type] ?? 0;
      placed[item.type] = row + 1;

      // Positions are not saved from the map yet (every item starts at 0, 0).
      // Until they are, place items in one column per type so they do not pile up.
      const hasPosition = item.positionX !== 0 || item.positionY !== 0;
      return {
        id: item.id,
        type: "item",
        position: hasPosition
          ? { x: item.positionX, y: item.positionY }
          : { x: column * COLUMN_WIDTH, y: row * ROW_HEIGHT },
        data: {
          title: item.title,
          category: item.type,
          // An unknown key is shown as "Unknown" instead of crashing (see CLAUDE.md)
          categoryLabel: itemTypes.find((type) => type.key === item.type)?.label ?? "Unknown",
          status: item.status,
        },
      };
    });

    const edges: Edge[] = relationships.relationships.map((relationship) => ({
      id: relationship.id,
      source: relationship.sourceItemId,
      target: relationship.targetItemId,
      // "smoothstep" draws straight lines with 90 degree bends and rounded corners
      type: "smoothstep",
      // The source item shows the label ("uses"), as described in CLAUDE.md
      label:
        template.template?.relationshipTypes.find((type) => type.key === relationship.type)?.label ??
        "Unknown",
    }));

    return { nodes, edges };
  }, [template.template, items.items, relationships.relationships]);

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
  }

  if (loading) return <p>Loading map…</p>;

  if (error) {
    return (
      <div role="alert">
        <p>{error}</p>
        <button type="button" onClick={tryAgain}>
          Try again
        </button>
      </div>
    );
  }

  if (items.items.length === 0) return <p>No items yet. Add some in the File view.</p>;

  return (
    // React Flow fills its parent, so the parent needs an explicit height.
    <div style={{ width: "100%", height: "70vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        // A click on a node (not a drag) opens the item's detail view. The node id is the item id.
        onNodeClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
        // Read-only: connections are made in a later step
        nodesConnectable={false}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
