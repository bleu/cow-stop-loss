"use client";

import "reactflow/dist/base.css";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useCallback } from "react";
import ReactFlow, {
  EdgeChange,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import { Address } from "viem";

import { ChainId } from "#/lib/publicClients";
import {
  INodeData,
  IStopLossConditionData,
  IStopLossRecipeData,
} from "#/lib/types";

import { defaultEdgeProps } from "./edges";
import { AddHook } from "./edges/AddHook";
import { defaultNodeProps } from "./nodes";
import { EndNode } from "./nodes/EndNode";
import { MultiSendNode } from "./nodes/MultiSendNode";
import { defaultStopLossData, StopLossNode } from "./nodes/StopLossNode";
import { getDefaultSwapData, SwapNode } from "./nodes/SwapNode";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
  hookMultiSend: MultiSendNode,
  endNode: EndNode,
};

const edgeTypes = {
  addHook: AddHook,
};

export const getLayoutedNodes = (nodes: Node<INodeData>[]) => {
  return nodes.map((node, index) => ({
    ...node,
    position: { x: 0, y: index * 150 },
  }));
};

const initEdges = [
  {
    id: "condition-swap",
    source: "condition",
    target: "swap",
    type: "addHook",
    ...defaultEdgeProps,
  },
  {
    id: "swap-end",
    source: "swap",
    target: "end",
    type: "addHook",
    ...defaultEdgeProps,
  },
];

const createInitNodes = (data: IStopLossRecipeData) =>
  [
    {
      id: "condition",
      type: "stopLoss",
      data: data as IStopLossConditionData,
      ...defaultNodeProps,
    },
    {
      id: "swap",
      type: "swap",
      data: data as IStopLossRecipeData,
      ...defaultNodeProps,
    },
    {
      id: "end",
      type: "endNode",
      selectable: false,
      ...defaultNodeProps,
    },
  ] as Node<INodeData>[];

export const Board = () => {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const layoutedNodes = getLayoutedNodes(
    createInitNodes({
      ...getDefaultSwapData(chainId, safeAddress as Address),
      ...defaultStopLossData,
      preHooks: [],
      chainId: chainId as ChainId,
    })
  );

  const [nodes, _setNodes, onNodesChange] =
    useNodesState<INodeData>(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { fitView } = useReactFlow();

  const onNodesDelete = useCallback(
    (deleted: Node<INodeData>[]) => {
      if (deleted.some((node) => node.id === "swap" || node.id === "condition"))
        return;
      setEdges(
        deleted.reduce((acc, node) => {
          const incomers = getIncomers(node, nodes, edges);
          const outgoers = getOutgoers(node, nodes, edges);
          const connectedEdges = getConnectedEdges([node], edges);

          const remainingEdges = acc.filter(
            (edge) => !connectedEdges.includes(edge)
          );

          const createdEdges = incomers.flatMap(({ id: source }) =>
            outgoers.map(({ id: target }) => ({
              id: `${source}-${target}`,
              source,
              target,
            }))
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );
    },
    [nodes, edges]
  );

  function handleNodesChange(changes: NodeChange[]) {
    const nextChanges = changes.reduce((acc, change) => {
      // prevent removing the swap and stop loss nodes
      if (change.type === "remove") {
        if (change.id !== "swap" && change.id !== "condition") {
          return [...acc, change];
        }
        return acc;
      }
      return [...acc, change];
    }, [] as NodeChange[]);
    fitView({ duration: 1000 });
    onNodesChange(nextChanges);
  }

  function handleEdgeChange(changes: EdgeChange[]) {
    const nextChanges = changes.reduce((acc, change) => {
      // prevent removing the swap and stop loss nodes
      if (change.type === "remove") {
        return acc;
      }
      return [...acc, change];
    }, [] as EdgeChange[]);
    onEdgesChange(nextChanges);
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onEdgesChange={handleEdgeChange}
      onNodesChange={handleNodesChange}
      fitView
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      edgesUpdatable={false}
      onNodesDelete={onNodesDelete}
      edgesFocusable={false}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      className="bg-blue2 size-full rounded-md shadow-md"
    />
  );
};

export function Flow() {}
