import { Background, Controls, ReactFlow, useEdgesState, useNodesState } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ItemNode } from "../features/map/ItemNode";
import { mockEdges, mockNodes } from "../features/map/mockData";

// Defined outside the component so the object is not recreated on every render.
// Maps a node's `type` string to the component that draws it.
const nodeTypes = { item: ItemNode };

// Temporary page for the React Flow prototype (sprint 1). Replaced by the real map in sprint 3.
export function MapPrototypePage() {
  // Like useState, but with a built-in change handler. Dragging a node produces
  // "change" events; onNodesChange applies them to `nodes`, so the node moves.
  const [nodes, , onNodesChange] = useNodesState(mockNodes);
  const [edges, , onEdgesChange] = useEdgesState(mockEdges);

  return (
    // React Flow fills its parent, so the parent needs an explicit height.
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        // Fires once when a drag is released (unlike onNodesChange, which fires many times a second).
        // This is where saving positions to the API would go. Prototype: just look at the data.
        onNodeDragStop={(_event, node) => console.log("drag stop", node.id, node.position)}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
