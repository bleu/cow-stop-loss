"use client";

import React, { useCallback } from "react";
import ReactFlow, { useNodesState, useEdgesState, addEdge } from "reactflow";

import "reactflow/dist/base.css";
import SwapNode from "./nodes/SwapNode";
import StopLossNode from "./nodes/StopLossNode";
import { INode, IStopLossRecipeData } from "@/lib/types";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
};

const initEdges = [
  {
    id: "e1",
    source: "1",
    target: "2",
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
  selected?: INode;
  setSelected: any;
}) => {
  const initNodes = React.useMemo(
    () => [
      {
        id: "1",
        type: "stopLoss",
        data: {
          ...selected?.data,
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "2",
        type: "swap",
        data: {
          ...selected?.data,
        },
        position: { x: 0, y: 200 },
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
