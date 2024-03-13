"use client";

import "reactflow/dist/base.css";

import React, { useCallback } from "react";
import ReactFlow, {
  Edge,
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

import { INodeData } from "#/lib/types";

import { defaultEdgeProps } from "./edges";
import { AddHookEdge } from "./edges/AddHookEdge";
import { EndNode } from "./nodes/EndNode";
import { MintBalNode } from "./nodes/MintBalNode";
import { MultiSendNode } from "./nodes/MultiSendNode";
import { StopLossNode } from "./nodes/StopLossNode";
import { SwapNode } from "./nodes/SwapNode";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
  hookMultiSend: MultiSendNode,
  hookMintBal: MintBalNode,
  endNode: EndNode,
};

const edgeTypes = {
  addHook: AddHookEdge,
};

export const getLayoutedNodes = (nodes: Node<INodeData>[]) => {
  return nodes.map((node, index) => ({
    ...node,
    position: { x: 0, y: index * 150 },
  }));
};

export function Board({
  initNodes,
  initEdges,
}: {
  initNodes: Node<INodeData>[];
  initEdges: Edge[];
}) {
  const [edges, setEdges, onEdgesChange] = useEdgesState(initEdges);
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState<INodeData>(
    getLayoutedNodes(initNodes)
  );

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
              type: "addHook",
              ...defaultEdgeProps,
            }))
          );

          return [...remainingEdges, ...createdEdges];
        }, edges)
      );

      setNodes(
        getLayoutedNodes(
          nodes.filter((node) => !deleted.map((n) => n.id).includes(node.id))
        )
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
}

export function Flow() {}
