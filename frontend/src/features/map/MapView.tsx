import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, Controls, ReactFlow, useNodesState, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { updateItem } from "../items/itemsApi";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { useRelationships } from "../relationships/useRelationships";
import { ItemNode } from "./ItemNode";
import type { ItemNodeType } from "./types";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// The relationship map: items as nodes, relationships as arrows.
// Click a node to open the item's detail view. Drag a node to move it: the new position is saved
// when the drag ends.
export function MapView({ project }: { project: Project }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const [saveError, setSaveError] = useState<string | null>(null);

  const loading = template.loading || items.loading || relationships.loading;
  const error = template.error ?? items.error ?? relationships.error;

  // Rebuilt only when the data changes, not on every render
  const { itemNodes, edges } = useMemo(() => {
    if (!template.template) return { itemNodes: [], edges: [] };
    const itemTypes = template.template.itemTypes;

    const nodes: ItemNodeType[] = items.items.map((item) => {
      return {
        id: item.id,
        type: "item",
        // The backend gives every new item a start position (services/itemLayout.ts),
        // so (0, 0) is a real position: the first row of the first column.
        position: { x: item.positionX, y: item.positionY },
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

    return { itemNodes: nodes, edges };
  }, [template.template, items.items, relationships.relationships]);

  // Fires once when a drag ends: save the new position of every node that was dragged
  // (several if a selection was dragged). If a save fails, reload the saved positions.
  async function handleDragStop(draggedNodes: ItemNodeType[]) {
    setSaveError(null);
    try {
      await Promise.all(
        draggedNodes.map((node) => updateItem(node.id, { positionX: node.position.x, positionY: node.position.y })),
      );
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save the position.");
      items.refetch();
    }
  }

  // React Flow needs its own copy of the nodes: while dragging it updates positions (and sizes it
  // measures) through onNodesChange. The copy is reset whenever the items are loaded again.
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemNodeType>([]);
  useEffect(() => setNodes(itemNodes), [itemNodes, setNodes]);

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
      {saveError && <p role="alert">{saveError}</p>}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        // A click on a node (not a drag) opens the item's detail view. The node id is the item id.
        onNodeClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_event, _node, draggedNodes) => handleDragStop(draggedNodes as ItemNodeType[])}
        // Connections are made in a later step
        nodesConnectable={false}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
