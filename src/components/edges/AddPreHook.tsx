import React, { useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  useReactFlow,
} from "reactflow";

import { IToken, nodeNames } from "#/lib/types";

import { getLayoutedElements } from "../Board";
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
    const tokenSell = getNode(target)?.data?.tokenSell;
    if (!tokenSell) return;
    const defaultData = getDefaultMultiSendData(tokenSell as IToken);
    const newNodes = [
      ...getNodes(),
      {
        id: newNodeId,
        type: nodeName,
        data: defaultData,
        ...defaultNodeProps,
      },
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

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      newNodes,
      newEdges
    );
    setNodes([...layoutedNodes]);
    setEdges([...layoutedEdges]);
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
    <div className="flex flex-row gap-2">
      <Button
        onClick={() => {
          onHookSelect("hookMultiSend");
        }}
        className="bg-blue9 hover:bg-blue7 my-2"
      >
        Multisend
      </Button>
      <Button className="bg-blue9 hover:bg-blue7 my-2">Aave withdraw</Button>
    </div>
  );
}
