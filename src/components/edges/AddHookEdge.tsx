import { Button, useToast } from "@bleu-fi/ui";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  Node,
  useReactFlow,
} from "reactflow";
import { Address } from "viem";

import {
  getDefaultMintBalData,
  getDefaultMultiSendData,
} from "#/lib/getOrderDefaultData";
import { ChainId } from "#/lib/publicClients";
import { IHooks, INodeData, ISwapData } from "#/lib/types";

import { getLayoutedNodes } from "../Board";
import { Dialog } from "../Dialog";
import { defaultNodeProps } from "../nodes";
import { defaultEdgeProps } from ".";

export const MAX_NODES = 7;

export function AddHookEdge({
  id,
  source,
  sourceX,
  sourceY,
  target,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const { setEdges, setNodes, getNodes, getEdges } = useReactFlow();
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const setNodesAndEdges = (newNode: Node<INodeData>) => {
    const oldNodes = getNodes();
    const targetIndex = oldNodes.findIndex((n) => n.id === target);
    const newNodes = getLayoutedNodes([
      ...oldNodes.slice(0, targetIndex),
      newNode,
      ...oldNodes.slice(targetIndex),
    ]);
    const edgesType = newNodes.length >= MAX_NODES ? "straight" : "addHook";
    const newEdges = [
      ...getEdges().filter((e) => e.id !== id),
      {
        id: `${source}-${newNode.id}`,
        source,
        target: newNode.id,
        ...defaultEdgeProps,
      },
      {
        id: `${newNode.id}-${target}`,
        source: newNode.id,
        target,
        ...defaultEdgeProps,
      },
    ].map((e) => ({ ...e, type: edgesType }));
    setNodes(newNodes);
    setEdges(newEdges);
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: "all",
          }}
        >
          <Dialog
            content={
              <ChooseHookDialog
                setNodesAndEdges={setNodesAndEdges}
                target={target}
                source={source}
                safeAddress={safeAddress as Address}
              />
            }
          >
            <Button className="flex rounded-full text-xs size-3 py-1 px-0 justify-center items-center text-center leading-3">
              +
            </Button>
          </Dialog>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function ChooseHookDialog({
  setNodesAndEdges,
  source,
  target,
  safeAddress,
}: {
  setNodesAndEdges: (node: Node<INodeData>) => void;
  target: string;
  source: string;
  safeAddress: Address;
}) {
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const { getNodes, getNode } = useReactFlow();
  const { toast } = useToast();

  function getOrderId(
    sourceNode: Node<INodeData>,
    targetNode: Node<INodeData>
  ): number {
    if (targetNode.id === "submit") {
      return sourceNode.data?.orderId as number;
    }
    return targetNode.data?.orderId as number;
  }

  function addHookNode(type: string, data: Omit<IHooks, "orderId">) {
    const targetNode = getNode(target) as Node<INodeData>;
    const sourceNode = getNode(source) as Node<INodeData>;
    const orderId = getOrderId(sourceNode, targetNode);
    const swapNode = getNode(`${orderId}-swap`) as Node<INodeData>;
    const targetIndex = getNodes().findIndex((n) => n.id === target);
    const swapNodeIndex = getNodes().findIndex((n) => n.id === "swap");
    const isBeforeSwap = targetIndex <= swapNodeIndex;
    const newNodeId = `${orderId}-hook-${Math.random().toString(36).substring(7)}`;
    if (!targetNode || !swapNode.data || !("tokenSell" in swapNode.data))
      return;
    const newNode = {
      id: `${isBeforeSwap ? "preHook" : "postHook"}-${newNodeId}`,
      type,
      data: {
        ...data,
        orderId,
      },
      ...defaultNodeProps,
    };
    setNodesAndEdges(newNode);
  }

  return (
    <div className="grid grid-cols-2 gap-2 bg-foreground">
      <Button
        className="p-2"
        onClick={async () => {
          const mintData = await getDefaultMintBalData(
            chainId as ChainId,
            safeAddress as Address
          );
          if (!mintData.gauges.length) {
            toast({
              title: "No gauges found",
              content: "This Safe has no gauges to mint from",
              variant: "destructive",
            });
            return;
          }
          addHookNode("hookMintBal", mintData);
        }}
      >
        Mint BAL from gauges
      </Button>
      <Button
        className="p-2"
        disabled
        onClick={() => {
          const swapNode = getNode("swap") as Node<ISwapData>;
          addHookNode(
            "hookMultiSend",
            getDefaultMultiSendData(swapNode.data.tokenSell, safeAddress)
          );
        }}
      >
        Multisend
      </Button>
      <Button className="p-2" disabled>
        Aave withdraw
      </Button>
      <Button className="p-2" disabled>
        Claim vesting
      </Button>
      <Button className="p-2" disabled>
        Exit pool
      </Button>
    </div>
  );
}
