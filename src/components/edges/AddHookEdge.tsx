import { Select, useToast } from "@bleu-fi/ui";
import { PlusCircledIcon } from "@radix-ui/react-icons";
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

import { getDefaultMintBalData } from "#/lib/getOrderDefaultData";
import { ChainId } from "#/lib/publicClients";
import { IHooks, INodeData } from "#/lib/types";

import { getLayoutedNodes } from "../Board";
import { Dialog } from "../Dialog";
import { defaultNodeProps } from "../nodes";
import { defaultEdgeProps } from ".";

export const MAX_NODES = 7;
export const HOOK_OPTIONS = [
  {
    label: "Mint BAL from gauges",
    value: "hookMintBal",
  },
  {
    label: "Multisend",
    value: "hookMultiSend",
  },
  {
    label: "Aave withdraw",
    value: "hookAaveWithdraw",
  },
  {
    label: "Claim vesting",
    value: "hookClaimVesting",
  },
  {
    label: "Exit pool",
    value: "hookExitPool",
  },
];

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
          <ChooseHookDialog
            setNodesAndEdges={setNodesAndEdges}
            source={source}
            target={target}
            safeAddress={safeAddress as Address}
          />
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
  const [hookSelected, setHookSelected] = React.useState<string>();

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
  const addMintBalHook = () => {
    getDefaultMintBalData(chainId as ChainId, safeAddress as Address).then(
      (mintData) => {
        if (!mintData.gauges.length) {
          toast({
            title: "No gauges found",
            description: "This Safe has no gauges to mint from",
            variant: "destructive",
          });
          throw new Error("No gauges found");
        }
        addHookNode("hookMintBal", mintData);
      }
    );
  };

  return (
    <Dialog
      title="Choose and Add Hook"
      submitText="Add Hook"
      onSubmit={addMintBalHook}
      disableSubmit={!hookSelected}
      content={
        <HookSelect
          hookSelected={hookSelected}
          onHookSelect={setHookSelected}
        />
      }
    >
      <button className="flex justify-center items-center text-foreground border-foreground hover:border-highlight hover:text-highlight bg-background">
        <PlusCircledIcon className="size-4" />
      </button>
    </Dialog>
  );
}

function HookSelect({
  hookSelected,
  onHookSelect,
}: {
  hookSelected?: string;
  onHookSelect: (hook: string) => void;
}) {
  return (
    <Select.SelectRoot onValueChange={onHookSelect} value={hookSelected}>
      <Select.SelectTrigger className="h-[35px] inline-flex w-full items-center gap-[5px] bg-input border border-background">
        <Select.SelectValue placeholder="Choose one of the available hooks" />
      </Select.SelectTrigger>
      <Select.SelectContent className="z-[10000] w-full overflow-hidden bg-input text-primary-foreground">
        <Select.SelectGroup>
          <Select.SelectLabel className="pl-4" />
          {HOOK_OPTIONS.map((option) => {
            const disabled = option.value != "hookMintBal";
            return (
              <Select.SelectItem
                key={option.value}
                value={option.value}
                disabled={disabled}
              >
                {option.label} {disabled && "(Coming soon)"}
              </Select.SelectItem>
            );
          })}
        </Select.SelectGroup>
      </Select.SelectContent>
    </Select.SelectRoot>
  );
}
