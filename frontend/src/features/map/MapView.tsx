import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, Controls, ReactFlow, useNodesState, type Connection, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { updateItem } from "../items/itemsApi";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { createRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import { ConnectionPrompt } from "./ConnectionPrompt";
import { ItemNode } from "./ItemNode";
import type { ItemNodeType } from "./types";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// The relationship map: items as nodes, relationships as arrows.
// Click a node to open the item's detail view. Drag a node to move it: the new position is saved
// when the drag ends. Drag from one node's right dot to another's left dot to connect them.
export function MapView({ project }: { project: Project }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const [saveError, setSaveError] = useState<string | null>(null);
  // The two item ids of an arrow that was just dragged, while the user picks a relationship type
  const [pending, setPending] = useState<{ sourceId: string; targetId: string } | null>(null);

  const loading = template.loading || items.loading || relationships.loading;
  const error = template.error ?? items.error ?? relationships.error;

  // Rebuilt only when the data changes, not on every render
  const itemNodes = useMemo(() => {
    const itemTypes = template.template?.itemTypes ?? [];

    return items.items.map((item): ItemNodeType => {
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
  }, [template.template, items.items]);

  const edges = useMemo(() => {
    return relationships.relationships.map((relationship): Edge => ({
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
  }, [template.template, relationships.relationships]);

  // Fires once when a drag ends: save the new position of every node that was dragged
  // (several if a selection was dragged). If a save fails, reload the saved positions.
  async function handleDragStop(draggedNodes: ItemNodeType[]) {
    setSaveError(null);
    try {
      await Promise.all(
        draggedNodes.map((node) => updateItem(node.id, { positionX: node.position.x, positionY: node.position.y })),
      );
      // Keep the items in step with the saved positions, so the nodes are not reset to old ones
      items.setItems((current) =>
        current.map((item) => {
          const node = draggedNodes.find((n) => n.id === item.id);
          return node ? { ...item, positionX: node.position.x, positionY: node.position.y } : item;
        }),
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

  // Creates the connection that was dragged. Returns an error message, or null when it worked.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  async function connect(relationshipType: string) {
    if (!pending) return null;
    try {
      const relationship = await createRelationship({
        sourceItemId: pending.sourceId,
        targetItemId: pending.targetId,
        type: relationshipType,
      });
      relationships.setRelationships((current) => [...current, relationship]);
      setPending(null);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Something went wrong.";
    }
  }

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

  const pendingSource = items.items.find((item) => item.id === pending?.sourceId);
  const pendingTarget = items.items.find((item) => item.id === pending?.targetId);

  if (items.items.length === 0) return <p>No items yet. Add some in the File view.</p>;

  return (
    <>
      {saveError && <p role="alert">{saveError}</p>}
      {pendingSource && pendingTarget && template.template && (
        // key: a new prompt (with fresh state) for every new connection
        <ConnectionPrompt
          key={`${pendingSource.id}-${pendingTarget.id}`}
          source={pendingSource}
          target={pendingTarget}
          template={template.template}
          onSubmit={connect}
          onCancel={() => setPending(null)}
        />
      )}
      {/* React Flow fills its parent, so the parent needs an explicit height. */}
      <div style={{ width: "100%", height: "70vh" }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          // A click on a node (not a drag) opens the item's detail view. The node id is the item id.
          onNodeClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
          onNodesChange={onNodesChange}
          onNodeDragStop={(_event, _node, draggedNodes) => handleDragStop(draggedNodes as ItemNodeType[])}
          // Drag from the dot on the right of a node to the dot on the left of another one
          onConnect={(connection: Connection) =>
            setPending({ sourceId: connection.source, targetId: connection.target })
          }
          // An item cannot be connected to itself
          isValidConnection={(connection) => connection.source !== connection.target}
          fitView
        >
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </>
  );
}
