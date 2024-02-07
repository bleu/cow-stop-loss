"use client";

import React, { useEffect } from "react";
import ReactFlow, { useNodesState } from "reactflow";

import "reactflow/dist/base.css";
import SwapNode from "./nodes/SwapNode";
import StopLossNode from "./nodes/StopLossNode";
import { IStopLossRecipeData } from "@/lib/types";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
};

const initEdges = [
  {
    id: "e1",
    source: "1",
    target: "2",
    animated: true,
  },
];

const createInitNodes = (data: IStopLossRecipeData) => [
  {
    id: "1",
    type: "stopLoss",
    data,
    position: { x: 0, y: 0 },
  },
  {
    id: "2",
    type: "swap",
    data,
    position: { x: 0, y: 200 },
  },
];

const Flow = ({
  setSelected,
  data,
}: {
  setSelected: any;
  data: IStopLossRecipeData;
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(createInitNodes(data));

  useEffect(() => {
    setNodes(nodes.map((node) => ({ ...node, data })));
    console.log("updates node");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setNodes, data]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={initEdges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      fitView
      edgesUpdatable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      onNodeClick={(_, node) => setSelected({ id: node.id, type: node.type })}
      onPaneClick={() => setSelected(null)}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      defaultMarkerColor=""
      className="bg-blue2 h-full w-full rounded-md shadow-md"
    />
  );
};

export default Flow;
