"use client";

import "reactflow/dist/base.css";

import dagre from "dagre";
import React, { useEffect } from "react";
import ReactFlow, {
  Edge,
  Node,
  Position,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import {
  INodeData,
  IStopLossConditionData,
  IStopLossRecipeData,
} from "#/lib/types";

import { defaultEdgeProps } from "./edges";
import { AddPreHook } from "./edges/AddPreHook";
import { defaultNodeProps } from "./nodes";
import { MultiSendNode } from "./nodes/MultiSendNode";
import { StopLossNode } from "./nodes/StopLossNode";
import { SwapNode } from "./nodes/SwapNode";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
  hookMultiSend: MultiSendNode,
};

const edgeTypes = {
  addPreHook: AddPreHook,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 100;

export const getLayoutedElements = (
  nodes: Node<INodeData>[],
  edges: Edge[]
) => {
  dagreGraph.setGraph({ rankdir: "TD" });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = Position.Top;
    node.sourcePosition = Position.Bottom;

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const initEdges = [
  {
    id: "condition-swap",
    source: "condition",
    target: "swap",
    type: "addPreHook",
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
  ] as Node<INodeData>[];

const Flow = ({
  setSelected,
  data,
}: {
  setSelected: (node: Node<INodeData> | undefined) => void;
  data: IStopLossRecipeData;
}) => {
  const { fitView } = useReactFlow();
  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
    createInitNodes(data),
    initEdges
  );

  const [nodes, setNodes, onNodesChange] =
    useNodesState<INodeData>(layoutedNodes);
  const [edges, _setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  useEffect(() => {
    setNodes(nodes.map((node) => ({ ...node, data })));
  }, [data]);

  useEffect(() => {
    fitView({ duration: 1000 });
  }, [nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      edgesUpdatable={false}
      edgesFocusable={false}
      nodesDraggable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      onNodeClick={(_, node) => setSelected(node)}
      onPaneClick={() => setSelected(undefined)}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      className="bg-blue2 size-full rounded-md shadow-md"
    />
  );
};

export default Flow;
