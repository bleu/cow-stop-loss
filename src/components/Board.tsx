"use client";

import React, { useCallback, useEffect } from "react";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
} from "reactflow";

import "reactflow/dist/base.css";

import CustomNode from "./CustomNode";

const nodeTypes = {
  custom: CustomNode,
};

const initEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
  },
  {
    id: "e1-3",
    source: "1",
    target: "3",
  },
];

export const SelectedNodeContext = React.createContext(null);

export const useSelectedNode = () => {
  const selected = React.useContext(SelectedNodeContext);
  if (!selected) {
    throw new Error(
      "useSelectedNode must be used within a SelectedNodeContext"
    );
  }
  return selected;
};

const Flow = ({
  selected,
  setSelected,
}: {
  selected: any;
  setSelected: any;
}) => {
  const initNodes = React.useMemo(
    () => [
      {
        id: "1",
        type: "custom",
        data: {
          name: "Jane Doe",
          job: "CEO",
          emoji: "😎",
          selected: selected.id === "1",
        },
        position: { x: 0, y: 50 },
      },
      {
        id: "2",
        type: "custom",
        data: {
          name: "Tyler Weary",
          job: "Designer",
          emoji: "🤓",
          selected: selected.id === "2",
        },
        position: { x: -200, y: 200 },
      },
      {
        id: "3",
        type: "custom",
        data: {
          name: "Kristi Price",
          job: "Developer",
          emoji: "🤩",
          selected: selected.id === "3",
        },
        position: { x: 200, y: 200 },
      },
    ],
    [selected]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);

  const onConnect = useCallback(
    // @ts-ignore
    (params) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  useEffect(() => {
    console.log({ selected });
  }, [selected]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      fitView
      edgesUpdatable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      // defaultEdgeOptions={}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      onNodeClick={(event, node) => setSelected(node)}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      className="bg-teal-50"
    />
  );
};

export default Flow;
