"use client";

import "reactflow/dist/base.css";

import { Button } from "@bleu-fi/ui";
import { PlusIcon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useCallback, useState } from "react";
import ReactFlow, {
  Edge,
  EdgeChange,
  getConnectedEdges,
  getIncomers,
  getOutgoers,
  Node,
  NodeChange,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
} from "reactflow";
import { Address } from "viem";

import { getOrderDefaultNodesAndEdges } from "#/lib/getOrderDefaultData";
import { ChainId } from "#/lib/publicClients";
import { IEdgeData, INodeData } from "#/lib/types";

import { defaultEdgeProps } from "./edges";
import { AddHookEdge } from "./edges/AddHookEdge";
import { MintBalNode } from "./nodes/MintBalNode";
import { StopLossNode } from "./nodes/StopLossNode";
import { SubmitNode } from "./nodes/SubmitNode";
import { SwapNode } from "./nodes/SwapNode";
import { Spinner } from "./Spinner";

const nodeTypes = {
  swap: SwapNode,
  stopLoss: StopLossNode,
  hookMintBal: MintBalNode,
  submitNode: SubmitNode,
};

const edgeTypes = {
  addHook: AddHookEdge,
};

export const getLayoutedNodes = (nodes: Node<INodeData>[]) => {
  const gapBetweenNodes = {
    x: 500,
    y: 150,
  };

  const uniqueOrdersIds = Array.from(
    new Set<number>(
      nodes
        .filter(({ data }) => data !== undefined)
        .map((node) => node.data?.orderId as number)
    )
  );

  const submitNode = nodes.find((node) => node.id === "submit");
  const maxOrderIdNodesLenght = Math.max(
    ...uniqueOrdersIds.map(
      (orderId) => nodes.filter((node) => node.data?.orderId === orderId).length
    )
  );

  const layoutedNodes = [
    {
      ...submitNode,
      position: {
        x: ((uniqueOrdersIds.length - 1) * gapBetweenNodes.x) / 2,
        y: maxOrderIdNodesLenght * gapBetweenNodes.y,
      },
    },
  ] as Node<INodeData>[];

  uniqueOrdersIds.forEach((orderId, colIndex) => {
    const nodesWithOrderId = nodes.filter(
      (node) => node.data?.orderId === orderId
    );
    layoutedNodes.push(
      ...nodesWithOrderId.map((node, rowIndex) => {
        return {
          ...node,
          position: {
            x: colIndex * gapBetweenNodes.x,
            y: rowIndex * gapBetweenNodes.y,
          },
        };
      })
    );
  });

  return layoutedNodes;
};

export function Board({
  initNodes,
  initEdges,
}: {
  initNodes: Node<INodeData>[];
  initEdges: Edge[];
}) {
  const {
    safe: { chainId, safeAddress },
  } = useSafeAppsSDK();
  const [edges, setEdges, onEdgesChange] = useEdgesState<IEdgeData>(initEdges);
  const { fitView, addNodes, addEdges } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<INodeData>(
    getLayoutedNodes(initNodes)
  );
  const [isAddingOrder, setIsAddingOrder] = useState(false);

  const orderIdsLenght = Array.from(
    new Set<number>(
      nodes
        .filter(({ data }) => data !== undefined)
        .map((node) => node.data?.orderId as number)
    )
  ).length;

  const onNodesDelete = useCallback(
    (deleted: Node<INodeData>[]) => {
      if (deleted.some((node) => node.id === "submit")) return;
      if (
        deleted.some((node) => node.type === "swap") ||
        deleted.some((node) => node.type === "stopLoss")
      ) {
        const nodesWithOrderId = nodes.filter(
          (node) => node.data?.orderId === (deleted[0].data?.orderId as number)
        );
        const edgesWithOrderId = edges.filter((edge) =>
          nodesWithOrderId.some((node) => node.id === edge.source)
        );
        setNodes(nodes.filter((node) => !nodesWithOrderId.includes(node)));
        setEdges(edges.filter((edge) => !edgesWithOrderId.includes(edge)));
        return;
      }

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
      // prevent removing submit node
      if (change.type === "remove") {
        if (change.id !== "submit") {
          return [...acc, change];
        }
        return acc;
      }
      return [...acc, change];
    }, [] as NodeChange[]);
    onNodesChange(nextChanges);
    fitView({ nodes, duration: 1000 });
  }

  function handleEdgeChange(changes: EdgeChange[]) {
    const nextChanges = changes.reduce((acc, change) => {
      // prevent removing edges
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
      onNodeClick={() => {
        setTimeout(() => {
          fitView({ duration: 1000 });
        }, 500);
      }}
      fitView
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      edgesUpdatable={false}
      onNodesDelete={onNodesDelete}
      edgesFocusable={false}
      nodesConnectable={false}
      nodesFocusable={false}
      draggable={false}
      panOnDrag={false}
      zoomOnPinch={false}
      zoomOnDoubleClick={false}
      zoomOnScroll={false}
      className="bg-blue2 size-full rounded-md shadow-md"
    >
      <Panel position="top-left">
        <div className="flex flex-row gap-4">
          <Button
            onClick={() => {
              setIsAddingOrder(true);
              getOrderDefaultNodesAndEdges(
                chainId as ChainId,
                safeAddress as Address,
                nodes
              ).then(({ orderEdges, orderNodes }) => {
                addNodes(orderNodes);
                addEdges(orderEdges);
                setNodes(getLayoutedNodes([...nodes, ...orderNodes]));
                setIsAddingOrder(false);
              });
            }}
            className="bg-blue9 hover:bg-blue10 text-white rounded-md"
            disabled={isAddingOrder || orderIdsLenght >= 3}
          >
            {isAddingOrder ? (
              <Spinner size="sm" />
            ) : (
              <div className="flex flex-row justify-center text-center items-center gap-4">
                <PlusIcon />
                Add order
              </div>
            )}
          </Button>
        </div>
      </Panel>
    </ReactFlow>
  );
}
