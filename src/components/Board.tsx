"use client";

import "reactflow/dist/base.css";

import ELK, { ElkExtendedEdge } from "elkjs/lib/elk.bundled.js";
import React, { useCallback, useEffect, useLayoutEffect } from "react";
import ReactFlow, {
  Node,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";

import { INodesData, IStopLossRecipeData, nodeTypes } from "#/lib/types";

import { AddPreHookNode } from "./nodes/AddPreHookNode";
import StopLossNode from "./nodes/StopLossNode";
import SwapNode from "./nodes/SwapNode";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
  addPreHook: AddPreHookNode,
};

const elk = new ELK();

const initialPosition = { x: 0, y: 0 };

const elkOptions = {
  "elk.algorithm": "layered",
  "elk.layered.spacing.nodeNodeBetweenLayers": "100",
  "elk.spacing.nodeNode": "80",
  "elk.direction": "DOWN",
  "elk.radial.centerOnRoot": "true",
};

const initEdges = [
  {
    id: "e1",
    source: "stopLossCondition",
    target: "addPreHook",
    animated: true,
  },
  {
    id: "e2",
    source: "addPreHook",
    target: "swap",
    animated: true,
  },
];

const createInitNodes = (data: IStopLossRecipeData) =>
  [
    {
      id: "stopLossCondition",
      type: "stopLoss",
      position: initialPosition,
      data,
    },
    {
      id: "addPreHook",
      type: "addPreHook",
      position: initialPosition,
      data,
    },
    {
      id: "swap",
      type: "swap",
      position: initialPosition,
      data,
    },
  ] as Node<IStopLossRecipeData>[];

const getLayoutedElements = (
  nodes: Node<INodesData>[],
  edges: ElkExtendedEdge[],
  options = {}
) => {
  const graph = {
    id: "root",
    layoutOptions: options,
    children: nodes.map((node: Node<INodesData>) => ({
      ...node,
      targetPosition: "top",
      sourcePosition: "bottom",
      width: 50,
      height: 50,
    })),
    edges: edges,
  };

  return elk.layout(graph).then((layoutedGraph) => {
    return {
      nodes: layoutedGraph.children?.map((node) => ({
        ...node,
        position: { x: node.x, y: node.y },
      })),
    };
  });
};

const Flow = ({
  setSelected,
  data,
}: {
  setSelected: (node: Node<INodesData> | undefined) => void;
  data: IStopLossRecipeData;
}) => {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<IStopLossRecipeData>(
    createInitNodes(data)
  );
  const [edges, _setEdges, onEdgesChange] =
    useEdgesState<IStopLossRecipeData>(initEdges);

  const onLayout = useCallback(() => {
    getLayoutedElements(
      // @ts-ignore
      nodes,
      // @ts-ignore
      edges,
      elkOptions
    ).then(({ nodes: layoutedNodes }) => {
      // @ts-ignore
      setNodes(layoutedNodes);
      // @ts-ignore
    });
  }, [nodes]);

  useEffect(() => {
    setNodes(nodes.map((node) => ({ ...node, data })));
  }, [data]);

  useLayoutEffect(() => {
    onLayout();
  }, []);

  useEffect(() => {
    fitView({ nodes, duration: 1000 });
  }, [nodes]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onEdgesChange={onEdgesChange}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
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
