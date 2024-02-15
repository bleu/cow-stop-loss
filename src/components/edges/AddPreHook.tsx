import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import React, { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  Node,
  useReactFlow,
} from "reactflow";
import { Address } from "viem";

import { INodeData, IToken, nodeNames } from "#/lib/types";

import { getLayoutedNodes } from "../Board";
import { Dialog } from "../Dialog";
import { defaultNodeProps } from "../nodes";
import { getDefaultMultiSendData } from "../nodes/MultiSendNode";
import { Button } from "../ui/button";
import { defaultEdgeProps } from ".";

export function AddPreHook({
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
  const [open, setOpen] = useState(false);

  const { setEdges, setNodes, getNodes, getNode, getEdges } = useReactFlow();
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

  const onHookSelect = (nodeName: nodeNames) => {
    const newNodeId = `${Math.random().toString(36).substring(7)}`;
    const targetNode = getNode(target) as Node<INodeData>;
    if (!targetNode || !("tokenSell" in targetNode.data)) return;
    const defaultData = getDefaultMultiSendData(
      targetNode.data.tokenSell as IToken,
      safeAddress as Address
    );
    const newNodes = [
      ...getNodes().filter((n) => n.id !== target),
      {
        id: newNodeId,
        type: nodeName,
        data: defaultData,
        ...defaultNodeProps,
      },
      targetNode,
    ];

    const newEdges = [
      ...getEdges().filter((e) => e.id !== id),
      {
        id: `${source}-${newNodeId}`,
        source,
        target: newNodeId,
        ...defaultEdgeProps,
      },
      {
        id: `${newNodeId}-${target}`,
        source: newNodeId,
        target,
        type: "addPreHook",
        ...defaultEdgeProps,
      },
    ];

    setNodes(getLayoutedNodes(newNodes));
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
            content={<ChooseHookDialog onHookSelect={onHookSelect} />}
            isOpen={open}
            setIsOpen={setOpen}
            title="Choose the hook to add"
          >
            <button
              className="bg-slate9 hover:bg-slate7 rounded-full text-xs size-3 text-center leading-3"
              onClick={() => setOpen(true)}
            >
              +
            </button>
          </Dialog>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

export function ChooseHookDialog({
  onHookSelect,
}: {
  onHookSelect: (nodeName: nodeNames) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <Button
        onClick={() => {
          onHookSelect("hookMultiSend");
        }}
        className="bg-blue9 hover:bg-blue7"
      >
        Multisend
      </Button>
      <Button className="bg-blue9 hover:bg-blue7" disabled>
        Aave withdraw
      </Button>
      <Button className="bg-blue9 hover:bg-blue7" disabled>
        Claim vesting
      </Button>
      <Button className="bg-blue9 hover:bg-blue7" disabled>
        Exit pool
      </Button>
    </div>
  );
}
