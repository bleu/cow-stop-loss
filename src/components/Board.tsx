"use client";

import React, { useCallback, useEffect } from "react";
import ReactFlow, { useEdgesState, useNodesState } from "reactflow";

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
  data,
}: {
  selected?: INode;
  setSelected: any;
  data: IStopLossRecipeData;
}) => {
  const initNodes = React.useMemo(
    () => [
      {
        id: "1",
        type: "stopLoss",
        data: {
          ...data,
          selected: selected?.id === "1",
        },
        position: { x: 0, y: 0 },
      },
      {
        id: "2",
        type: "swap",
        data: {
          ...data,
          selected: selected?.id === "2",
        },
        position: { x: 0, y: 200 },
      },
    ],
    [selected]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initNodes);

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
      onNodeClick={(event, node) =>
        setSelected({ id: node.id, type: node.type })
      }
      onPaneClick={() => setSelected(null)}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      className="bg-teal-50"
    />
  );
};

export default Flow;
