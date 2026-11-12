import { useConfirm } from "../../components/useConfirm";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, Controls, MiniMap, Panel, ReactFlow, useNodesState, type Connection, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { getGroupsOfItem } from "../groups/itemGroups";
import { useGroups } from "../groups/useGroups";
import { ItemForm } from "../items/ItemForm";
import { createItem, updateItem } from "../items/itemsApi";
import { getTypeColor } from "../items/typeColor";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import type { WarningsByItem } from "../warnings/types";
import { ConnectionPrompt } from "./ConnectionPrompt";
import { ItemFilterBar } from "../filters/ItemFilterBar";
import { hasFilters, matchesFilters, NO_FILTERS, type ItemFilters } from "../filters/itemFilters";
import { ItemNode } from "./ItemNode";
import { MapLegend } from "./MapLegend";
import type { ItemNodeType } from "./types";
import styles from "./MapView.module.css";

// Defined outside the component so the object is not recreated on every render.
const nodeTypes = { item: ItemNode };

// How faded the items and connections are that are not in focus (filtered out, or not connected to the selection)
const FADED = 0.2;
// The "half state": an item connected to the selected item, but filtered out
const HALF_FADED = 0.6;

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
  const { confirm, modal } = useConfirm();
  const [adding, setAdding] = useState(false);
  // The connection that was clicked, which offers a delete button
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // The two item ids of an arrow that was just dragged, while the user picks a relationship type
  const [pending, setPending] = useState<{ sourceId: string; targetId: string } | null>(null);
  // The node that was clicked: it and its connections light up (impact view)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Items that do not match the filters fade, so the matching ones stand out
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
          color: itemTypes.find((type) => type.key === item.type)?.color,
          status: item.status,
          groups: getGroupsOfItem(item.id, groups.groups).map(({ id, name, color }) => ({ id, name, color })),
          warnings: (warnings.get(item.id) ?? []).map((warning) => warning.message),
        },
      };
    });
  }, [template.template, items.items, groups.groups, warnings]);

  // The ids of the items that match the filters, or null when no filter is set (nothing fades)
  const matchingIds = useMemo(() => {
    if (!hasFilters(filters)) return null;
    return new Set(items.items.filter((item) => matchesFilters(item, filters, groups.groups)).map((item) => item.id));
  }, [items.items, groups.groups, filters]);

  const edges = useMemo(() => {
    // Item id -> item, to find the type (and so the color) of an edge's source item
    const itemsById = new Map(items.items.map((item) => [item.id, item]));

    return relationships.relationships.map((relationship): Edge => {
      // Impact view: with a node selected, its own connections light up and the rest fade
      const touchesSelected =
        relationship.sourceItemId === selectedNodeId || relationship.targetItemId === selectedNodeId;
      // With a filter, a connection stays visible when at least one end matches,
      // so you can see what the matching items are connected to
      const touchesMatch =
        !matchingIds || matchingIds.has(relationship.sourceItemId) || matchingIds.has(relationship.targetItemId);
      const source = itemsById.get(relationship.sourceItemId);
      const sourceColor = template.template && source ? getTypeColor(template.template, source.type) : undefined;
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
        // A lit-up connection takes the color of its source item's type ("page uses design": page blue).
        // Unknown types fall back to the brand color.
        // With a filter, the filter decides what fades. Without one, the selection does.
        style:
          selectedNodeId && touchesSelected
            ? { stroke: sourceColor ?? "var(--primary)", strokeWidth: 3 }
            : (matchingIds ? !touchesMatch : selectedNodeId !== null)
              ? { opacity: FADED }
              : undefined,
      };
    });
  }, [template.template, items.items, relationships.relationships, selectedNodeId, matchingIds]);

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

  // Fading instead of hiding keeps the whole map and its connections in view.
  // With a filter, the filter decides and a selection only adds to it:
  // - Matches the filter: never faded, even when another item is selected.
  // - Filtered out, but connected to the selected item: half faded, so the connections can still be read.
  // - Filtered out and not connected: faded.
  // Without a filter: items not connected to the selected item fade.
  // The selected item itself is never faded: you clicked it.
  const shownNodes = useMemo(() => {
    let connectedIds: Set<string> | null = null;
    if (selectedNodeId) {
      connectedIds = new Set([selectedNodeId]);
      for (const r of relationships.relationships) {
        if (r.sourceItemId === selectedNodeId) connectedIds.add(r.targetItemId);
        if (r.targetItemId === selectedNodeId) connectedIds.add(r.sourceItemId);
      }
    }
    return nodes.map((node) => {
      const connected = connectedIds?.has(node.id) ?? false;
      let opacity: number | undefined;
      if (node.id === selectedNodeId) {
        opacity = undefined;
      } else if (matchingIds) {
        if (!matchingIds.has(node.id)) opacity = connected ? HALF_FADED : FADED;
      } else if (connectedIds && !connected) {
        opacity = FADED;
      }
      return opacity === undefined ? node : { ...node, style: { ...node.style, opacity } };
    });
  }, [nodes, relationships.relationships, selectedNodeId, matchingIds]);

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
    if (!(await confirm({ title: "Remove connection?", message: "This connection will be removed.", confirmLabel: "Remove" }))) return;
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

  // The messages that float at the bottom of the map. Only shown when there is at least one.
  const hasMessage = items.items.length === 0 || (selectedEdge && edgeSource && edgeTarget) || saveError;

  return (
    // The controls float over the map in Panels instead of taking space above it.
    // A Panel stays in its corner when the map is moved or zoomed.
    <div className={styles.map}>
      {modal}
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
        // React Flow removes selected nodes and edges on Backspace by default. That only removed them from the map,
        // not from the database, so they came back on reload. Turned off: items are deleted on the item page
        // (with a confirmation that lists what else is deleted), connections with "Delete connection".
        deleteKeyCode={null}
        fitView
      >
        <Background />
        <Controls />
        {template.template && (
          <>
            {/* Top left: the filters and "Add item". The add form opens under them, in the same box. */}
            {/* data-tour: what the tutorial points at (features/tour/tourSteps.ts) */}
            <Panel position="top-left" className={styles.box} data-tour="map-toolbar">
              <div className={styles.toolbar}>
                <ItemFilterBar
                  filters={filters}
                  onChange={setFilters}
                  template={template.template}
                  groups={groups.groups}
                />
                {!adding && (
                  <button type="button" className={styles.small} onClick={() => setAdding(true)}>
                    + Add item
                  </button>
                )}
              </div>
              {adding && (
                <div className={styles.addForm}>
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
                </div>
              )}
            </Panel>
            <Panel position="top-right" data-tour="map-legend">
              <MapLegend template={template.template} />
            </Panel>
          </>
        )}
        {/* Top center: pick a relationship type after dragging an arrow between two nodes */}
        {pendingSource && pendingTarget && template.template && (
          <Panel position="top-center" className={`${styles.box} ${styles.message}`}>
            {/* key: a new prompt (with fresh state) for every new connection */}
            <ConnectionPrompt
              key={`${pendingSource.id}-${pendingTarget.id}`}
              source={pendingSource}
              target={pendingTarget}
              template={template.template}
              onSubmit={connect}
              onCancel={() => setPending(null)}
            />
          </Panel>
        )}
        {/* Bottom center: the clicked connection with its delete button, errors, and the empty state */}
        {hasMessage && (
          <Panel position="bottom-center" className={`${styles.box} ${styles.message}`}>
            {items.items.length === 0 && <p>No items yet. Use “+ Add item” to create the first one.</p>}
            {selectedEdge && edgeSource && edgeTarget && (
              <>
                <p>
                  {edgeSource.title} {edgeLabel ?? "Unknown"} {edgeTarget.title}
                </p>
                <button type="button" onClick={() => handleDeleteConnection(selectedEdge.id)}>
                  Delete connection
                </button>
              </>
            )}
            {saveError && <p role="alert">{saveError}</p>}
          </Panel>
        )}
        {/* Overview in the corner: every item as a small block in its type's color. Drag or scroll it to move the map. */}
        <MiniMap<ItemNodeType>
          // The MiniMap sets an SVG fill attribute, which can't read CSS variables, so the
          // fallback for unknown types is a hex value (the same as --borderDark)
          nodeColor={(node) => node.data.color ?? "#bdae99"}
          nodeBorderRadius={4}
          pannable
          zoomable
        />
      </ReactFlow>
    </div>
  );
}
