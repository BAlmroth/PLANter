import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, Controls, ReactFlow, useNodesState, type Connection, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { useGroups } from "../groups/useGroups";
import { ItemForm } from "../items/ItemForm";
import { createItem, updateItem } from "../items/itemsApi";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import type { WarningsByItem } from "../warnings/types";
import { ConnectionPrompt } from "./ConnectionPrompt";
import { ItemFilterBar } from "../filters/ItemFilterBar";
import { hasFilters, matchesFilters, NO_FILTERS, type ItemFilters } from "../filters/itemFilters";
import { ItemNode } from "./ItemNode";
import type { ItemNodeType } from "./types";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// The relationship map: items as nodes, relationships as arrows.
// Click a node to open the item's detail view. Drag a node to move it: the new position is saved
// when the drag ends. Drag from one node's right dot to another's left dot to connect them.
// Click a connection to delete it. The "Add item" button creates an item.
export function MapView({ project, warnings }: { project: Project; warnings: WarningsByItem }) {
  const navigate = useNavigate();
  const template = useTemplate(project.template);
  const items = useItems(project.id);
  const relationships = useRelationships(project.id);
  const groups = useGroups(project.id);
  // Shown above the map when saving a position or deleting a connection fails
  const [saveError, setSaveError] = useState<string | null>(null);
  // true while the add item form is open
  const [adding, setAdding] = useState(false);
  // The connection that was clicked, which offers a delete button
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // The two item ids of an arrow that was just dragged, while the user picks a relationship type
  const [pending, setPending] = useState<{ sourceId: string; targetId: string } | null>(null);
  // The node that was clicked: it and its connections light up (impact view)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Items that match the filters get a purple outline, the rest of the map stays as it is
  const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS);

  const loading = template.loading || items.loading || relationships.loading || groups.loading;
  const error = template.error ?? items.error ?? relationships.error ?? groups.error;

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
          warnings: (warnings.get(item.id) ?? []).map((warning) => warning.message),
        },
      };
    });
  }, [template.template, items.items, warnings]);

  const edges = useMemo(() => {
    return relationships.relationships.map((relationship): Edge => {
      // Impact view: with a node selected, its own connections light up and the rest fade
      const touchesSelected =
        relationship.sourceItemId === selectedNodeId || relationship.targetItemId === selectedNodeId;
      return {
        id: relationship.id,
        source: relationship.sourceItemId,
        target: relationship.targetItemId,
        // "smoothstep" draws straight lines with 90 degree bends and rounded corners
        type: "smoothstep",
        // The source item shows the label ("uses"), as described in CLAUDE.md
        label:
          template.template?.relationshipTypes.find((type) => type.key === relationship.type)?.label ??
          "Unknown",
        animated: touchesSelected,
        style: selectedNodeId
          ? touchesSelected
            ? { stroke: "#2563eb", strokeWidth: 3 }
            : { opacity: 0.2 }
          : undefined,
      };
    });
  }, [template.template, relationships.relationships, selectedNodeId]);

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

  // The selected node and the nodes directly connected to it stay bright, the others fade
  const shownNodes = useMemo(() => {
    // Filters outline the matching items instead of hiding the others, so the connections stay visible
    const matchingIds = new Set(
      items.items.filter((item) => matchesFilters(item, filters, groups.groups)).map((item) => item.id),
    );
    const visibleNodes = hasFilters(filters)
      ? nodes.map((node) =>
          matchingIds.has(node.id)
            ? { ...node, style: { outline: "3px solid #7c3aed", outlineOffset: 2, borderRadius: 8 } }
            : node,
        )
      : nodes;
    if (!selectedNodeId) return visibleNodes;
    const connectedIds = new Set<string>([selectedNodeId]);
    for (const r of relationships.relationships) {
      if (r.sourceItemId === selectedNodeId) connectedIds.add(r.targetItemId);
      if (r.targetItemId === selectedNodeId) connectedIds.add(r.sourceItemId);
    }
    return visibleNodes.map((node) => (connectedIds.has(node.id) ? node : { ...node, style: { ...node.style, opacity: 0.3 } }));
  }, [nodes, items.items, groups.groups, filters, relationships.relationships, selectedNodeId]);

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

  async function handleDeleteConnection(id: string) {
    if (!window.confirm("Remove this connection?")) return;
    setSaveError(null);
    try {
      await deleteRelationship(id);
      relationships.setRelationships((current) => current.filter((r) => r.id !== id));
      setSelectedEdgeId(null);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (groups.error) groups.refetch();
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

  const selectedEdge = relationships.relationships.find((r) => r.id === selectedEdgeId);
  const edgeSource = items.items.find((item) => item.id === selectedEdge?.sourceItemId);
  const edgeTarget = items.items.find((item) => item.id === selectedEdge?.targetItemId);
  const edgeLabel = template.template?.relationshipTypes.find((type) => type.key === selectedEdge?.type)?.label;

  return (
    <>
      {adding && template.template ? (
        <ItemForm
          types={template.template.itemTypes}
          submitLabel="Add item"
          onCancel={() => setAdding(false)}
          onSubmit={async ({ title, description, type }) => {
            try {
              // The backend gives the new item a start position (services/itemLayout.ts)
              const item = await createItem(project.id, {
                title,
                type,
                ...(description !== "" && { description }),
              });
              items.setItems((current) => [...current, item]);
              setAdding(false);
              return null;
            } catch (err) {
              return err instanceof ApiError ? err.message : "Something went wrong.";
            }
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)}>
          Add item
        </button>
      )}
      {template.template && (
        <ItemFilterBar filters={filters} onChange={setFilters} template={template.template} groups={groups.groups} />
      )}
      {items.items.length === 0 && <p>No items yet.</p>}
      {selectedEdge && edgeSource && edgeTarget && (
        <p>
          {edgeSource.title} {edgeLabel ?? "Unknown"} {edgeTarget.title}{" "}
          <button type="button" onClick={() => handleDeleteConnection(selectedEdge.id)}>
            Delete connection
          </button>
        </p>
      )}
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
          nodes={shownNodes}
          edges={edges}
          nodeTypes={nodeTypes}
          // A click on a node lights up its connections. A double click opens the item's detail view.
          // The node id is the item id.
          onNodeClick={(_event, node) => {
            setSelectedNodeId(node.id);
            setSelectedEdgeId(null);
          }}
          onNodeDoubleClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
          onNodesChange={onNodesChange}
          onNodeDragStop={(_event, _node, draggedNodes) => handleDragStop(draggedNodes as ItemNodeType[])}
          // Drag from the dot on the right of a node to the dot on the left of another one
          onConnect={(connection: Connection) =>
            setPending({ sourceId: connection.source, targetId: connection.target })
          }
          // Click a connection to get a delete button, click the background to dismiss it
        onEdgeClick={(_event, edge) => {
          setSelectedEdgeId(edge.id);
          setSelectedNodeId(null);
        }}
        onPaneClick={() => {
          setSelectedEdgeId(null);
          setSelectedNodeId(null);
        }}
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
