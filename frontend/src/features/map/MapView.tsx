import { useConfirm } from "../../components/useConfirm";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Background, ConnectionMode, Controls, MiniMap, Panel, ReactFlow, useNodesState, type Connection, type Edge, type ReactFlowInstance } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { Project } from "../projects/types";
import { ApiError } from "../../lib/api";
import { useGroups } from "../groups/useGroups";
import type { ItemFormValues } from "../items/ItemForm";
import { createItem, updateItem } from "../items/itemsApi";
import { useItems } from "../items/useItems";
import { useTemplate } from "../items/useTemplate";
import { getAllowedRelationshipTypes } from "../relationships/connections";
import { createRelationship, deleteRelationship } from "../relationships/relationshipsApi";
import { useRelationships } from "../relationships/useRelationships";
import type { WarningsByItem } from "../warnings/types";
import { ConnectionPrompt } from "./ConnectionPrompt";
import { hasFilters, matchesFilters, NO_FILTERS, type ItemFilters } from "../filters/itemFilters";
import { ItemNode } from "./ItemNode";
import { MapToolbar } from "./MapToolbar";
import { useFullWindow } from "./useFullWindow";
import { useCenterX } from "./useCenterX";
import { getCardSize } from "./cardSize";
import { buildEdges, buildNodes, fadeNodes } from "./mapGraph";
import { tidyLayout, type LayoutDirection } from "./tidyLayout";
import { readFlag, writeFlag } from "../../lib/storage";
import { MapLegend } from "./MapLegend";
import type { ItemNodeType } from "./types";
import styles from "./MapView.module.css";
import { Loader } from "../../components/Loader";
import { useGateLoading } from "../../components/useLoadGate";
import { connectionText } from "../relationships/quantity";

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
  const { confirm, modal } = useConfirm();
  // The React Flow instance, saved in onInit, to call fitView after "Tidy up"
  const flowRef = useRef<ReactFlowInstance<ItemNodeType, Edge> | null>(null);
  // true: the map covers the whole window (CSS only, not the browser's fullscreen mode)
  const { expanded, setExpanded } = useFullWindow(flowRef);
  // The map's box on the page. State (a callback ref), not useRef: the map is only rendered after
  // loading, and the state change tells useCenterX that it is there.
  const [mapElement, setMapElement] = useState<HTMLDivElement | null>(null);
  // Where the middle of the map is in the window, so the pinned message box can sit there
  const mapCenterX = useCenterX(mapElement);
  // Which way the map flows. A view preference, kept in this browser only (lib/storage.ts).
  const [direction, setDirection] = useState<LayoutDirection>(() => (readFlag("map:vertical") ? "vertical" : "horizontal"));
  // The connection that was clicked, which offers a delete button
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  // The two item ids of an arrow that was just dragged, while the user picks a relationship type
  const [pending, setPending] = useState<{ sourceId: string; targetId: string } | null>(null);
  // The node that was clicked: it and its connections light up (impact view)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  // Items that do not match the filters fade, so the matching ones stand out
  const [filters, setFilters] = useState<ItemFilters>(NO_FILTERS);

  const loading = template.loading || items.loading || relationships.loading || groups.loading;
  useGateLoading(loading);
  const error = template.error ?? items.error ?? relationships.error ?? groups.error;

  // Rebuilt only when the data changes, not on every render (the building is in mapGraph.ts)
  const itemNodes = useMemo(
    () => buildNodes(items.items, groups.groups, template.template, warnings, direction),
    [template.template, items.items, groups.groups, warnings, direction],
  );

  // The ids of the items that match the filters, or null when no filter is set (nothing fades)
  const matchingIds = useMemo(() => {
    if (!hasFilters(filters)) return null;
    return new Set(items.items.filter((item) => matchesFilters(item, filters, groups.groups)).map((item) => item.id));
  }, [items.items, groups.groups, filters]);

  const edges = useMemo(
    () => buildEdges(relationships.relationships, items.items, template.template, selectedNodeId, matchingIds),
    [template.template, items.items, relationships.relationships, selectedNodeId, matchingIds],
  );

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

  // "Tidy up": lay the items out from left to right by their connections (tidyLayout.ts).
  // This overwrites the positions the user set by hand, so it asks first.
  // Only items that actually move are saved.
  // newDirection: set when the user picks the other direction. It is only kept if they confirm.
  async function handleTidy(newDirection: LayoutDirection = direction) {
    const ok = await confirm({
      title: "Tidy up the map?",
      message: "All items are moved into columns based on their connections. Positions you set by hand are replaced.",
      confirmLabel: "Tidy up",
    });
    if (!ok) return;
    setSaveError(null);
    // Flip the connections whose type reads backwards ("component belongs_to page"), so the flow
    // reads left to right: page -> component. The saved connections are not changed.
    const backward = new Set(template.template?.relationshipTypes.filter((t) => t.readsBackward).map((t) => t.key));
    const flow = relationships.relationships.map((r) =>
      backward.has(r.type)
        ? { sourceItemId: r.targetItemId, targetItemId: r.sourceItemId }
        : { sourceItemId: r.sourceItemId, targetItemId: r.targetItemId },
    );
    // The cards have different sizes, so the layout needs each item's size to leave enough room
    const sizedItems = items.items.map((item) => ({
      id: item.id,
      size: template.template ? getCardSize(template.template, item.type) : undefined,
    }));
    const positions = tidyLayout(sizedItems, flow, newDirection);
    setDirection(newDirection);
    writeFlag("map:vertical", newDirection === "vertical");
    const moved = items.items.filter((item) => {
      const p = positions.get(item.id);
      return p && (p.positionX !== item.positionX || p.positionY !== item.positionY);
    });
    try {
      await Promise.all(moved.map((item) => updateItem(item.id, positions.get(item.id)!)));
      // Updating the items rebuilds the nodes (itemNodes), so the map moves by itself
      items.setItems((current) => current.map((item) => ({ ...item, ...positions.get(item.id) })));
      // Wait for the nodes to move, then zoom so the whole map is in view
      setTimeout(() => flowRef.current?.fitView({ duration: 300 }), 50);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save the new positions.");
      items.refetch();
    }
  }

  // React Flow needs its own copy of the nodes: while dragging it updates positions (and sizes it
  // measures) through onNodesChange. The copy is reset whenever the items are loaded again.
  const [nodes, setNodes, onNodesChange] = useNodesState<ItemNodeType>([]);
  useEffect(() => setNodes(itemNodes), [itemNodes, setNodes]);

  // Fades the nodes that are not in focus (the rules are in fadeNodes, mapGraph.ts)
  const shownNodes = useMemo(
    () => fadeNodes(nodes, relationships.relationships, selectedNodeId, matchingIds),
    [nodes, relationships.relationships, selectedNodeId, matchingIds],
  );

  // Creates the connection that was dragged. Returns an error message, or null when it worked.
  // The backend refuses combinations that are not allowed, duplicates and loops, and says why.
  // quantity: the amount from the prompt ("made from 20 Wood"), undefined when there is none
  async function connect(relationshipType: string, quantity: number | undefined) {
    if (!pending) return null;
    try {
      const relationship = await createRelationship({
        sourceItemId: pending.sourceId,
        targetItemId: pending.targetId,
        type: relationshipType,
        // Only sent when there is an amount, so other requests look exactly as before
        ...(quantity !== undefined && { quantity }),
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

  // Creates an item from the toolbar's form. Returns an error message, or null when it worked.
  async function addItem({ title, description, type }: ItemFormValues) {
    try {
      // The backend gives the new item a start position (services/itemLayout.ts)
      const item = await createItem(project.id, {
        title,
        type,
        ...(description !== "" && { description }),
      });
      items.setItems((current) => [...current, item]);
      return null;
    } catch (err) {
      return err instanceof ApiError ? err.message : "Something went wrong.";
    }
  }

  function tryAgain() {
    if (template.error) template.refetch();
    if (items.error) items.refetch();
    if (relationships.error) relationships.refetch();
    if (groups.error) groups.refetch();
  }

  if (loading) return <Loader label="Loading map…" size="page" />;

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
  // The template decides the direction of a relationship (a page uses a component, never the other way around).
  // If the arrow was dragged the "wrong" way, turn it around, so it does not matter which card you start on.
  // Called when an arrow is dragged between two nodes. The connection then waits in `pending` for its relationship type.
  function handleConnect(connection: Connection) {
    let sourceId = connection.source;
    let targetId = connection.target;
    const from = items.items.find((item) => item.id === sourceId);
    const to = items.items.find((item) => item.id === targetId);
    if (from && to && template.template) {
      const forward = getAllowedRelationshipTypes(from.type, to.type, template.template);
      const backward = getAllowedRelationshipTypes(to.type, from.type, template.template);
      if (forward.length === 0 && backward.length > 0) [sourceId, targetId] = [targetId, sourceId];
    }
    setPending({ sourceId, targetId });
  }

  const prompting = Boolean(pendingSource && pendingTarget && template.template);

  return (
    // The controls float over the map in Panels instead of taking space above it.
    // A Panel stays in its corner when the map is moved or zoomed.
    <div ref={setMapElement} className={expanded ? `${styles.map} ${styles.expanded}` : styles.map}>
      {modal}
      <ReactFlow
        nodes={shownNodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={(instance) => {
          flowRef.current = instance;
        }}
        // A click on a node lights up its connections. A double click opens the item's detail view.
        // The node id is the item id.
        onNodeClick={(_event, node) => {
          setSelectedNodeId(node.id);
          setSelectedEdgeId(null);
        }}
        onNodeDoubleClick={(_event, node) => navigate(`/projects/${project.id}/items/${node.id}`)}
        onNodesChange={onNodesChange}
        onNodeDragStop={(_event, _node, draggedNodes) => handleDragStop(draggedNodes as ItemNodeType[])}
        // Loose mode: a connection can start and end on any dot. Without it, a drag only works from a "source" dot
        // (right) to a "target" dot (left). The direction is still where you start dragging: source = the node you
        // dragged from, target = the node you dropped on.
        connectionMode={ConnectionMode.Loose}
        onConnect={handleConnect}
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
          // One Panel for the whole top row, so the two halves can never overlap: side by side when
          // there is room, and the right half wraps under the toolbar on a narrow screen (a phone).
          <Panel position="top-left" className={styles.topRow}>
            {/* Left: the filters, "Add item" and Manage */}
            <MapToolbar
              template={template.template}
              groups={groups.groups}
              itemCount={items.items.length}
              filters={filters}
              onFiltersChange={setFilters}
              direction={direction}
              onTidy={handleTidy}
              onAddItem={addItem}
            />
            {/* Right: the full window button and the legend side by side. data-tour is on the
                legend only, so the tutorial does not light up the button too. */}
            <div className={styles.topRight}>
              <button
                type="button"
                className={`${styles.small} ${styles.fullWindow}`}
                aria-pressed={expanded}
                onClick={() => setExpanded((open) => !open)}
                title={expanded ? "Back to the normal size (Esc)" : "Make the map fill the whole window"}
              >
                {expanded ? "Exit full window" : "Full window"}
              </button>
              <div data-tour="map-legend">
                <MapLegend template={template.template} />
              </div>
            </div>
          </Panel>
        )}
        {/* At the bottom of the window, centered over the map (pinned, see MapView.module.css), one box for everything that needs an answer, so two never overlap:
            picking a relationship type after dragging an arrow between two nodes, or else the clicked
            connection with its delete button, or the empty state. Errors show in both cases. */}
        {(prompting || hasMessage) && (
          <Panel
            position="bottom-center"
            className={`${styles.box} ${styles.message} ${styles.pinned}`}
            // React Flow centers the box with left: 50% and translateX(-50%). With position: fixed that is
            // the middle of the window, so left is moved to the middle of the map instead.
            style={mapCenterX !== null ? { left: mapCenterX } : undefined}
          >
            {pendingSource && pendingTarget && template.template ? (
              // key: a new prompt (with fresh state) for every new connection
              <ConnectionPrompt
                key={`${pendingSource.id}-${pendingTarget.id}`}
                source={pendingSource}
                target={pendingTarget}
                template={template.template}
                onSubmit={connect}
                onCancel={() => setPending(null)}
              />
            ) : (
              <>
                {items.items.length === 0 && <p>No items yet. Use “+ Add item” to create the first one.</p>}
                {selectedEdge && edgeSource && edgeTarget && (
                  <>
                    <p>
                      {edgeSource.title} {edgeLabel ?? "Unknown"}{" "}
                      {/* "20 × Wood" when the connection has an amount */}
                      {connectionText({
                        otherTitle: edgeTarget.title,
                        ...(selectedEdge.quantity != null && { amount: { value: selectedEdge.quantity, isSource: true } }),
                      })}
                    </p>
                    <button type="button" onClick={() => handleDeleteConnection(selectedEdge.id)}>
                      Delete connection
                    </button>
                  </>
                )}
              </>
            )}
            {saveError && <p role="alert">{saveError}</p>}
          </Panel>
        )}
        {/* Overview in the corner: every item as a small block in its type's color. Drag or scroll it to move the map. */}
        <MiniMap<ItemNodeType>
          // Hidden on a phone (MapView.module.css), where it would cover a large part of the map
          className={styles.miniMap}
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
