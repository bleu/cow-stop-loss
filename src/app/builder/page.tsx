"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Node, ReactFlowProvider } from "reactflow";
import { Address } from "viem";

import { Board } from "#/components/Board";
import { defaultEdgeProps } from "#/components/edges";
import Menu from "#/components/menus";
import { defaultNodeProps } from "#/components/nodes";
import { getDefaultStopLossData } from "#/components/nodes/StopLossNode";
import { getDefaultSwapData } from "#/components/nodes/SwapNode";
import { Spinner } from "#/components/Spinner";
import { ChainId } from "#/lib/publicClients";
import { INodeData } from "#/lib/types";

const createInitNodes = async (chainId: ChainId, safeAddress: Address) => {
  const swapData = getDefaultSwapData(chainId, safeAddress);
  const conditionData = await getDefaultStopLossData({
    chainId,
    tokenBuy: swapData.tokenBuy,
    tokenSell: swapData.tokenSell,
  });

  return [
    {
      id: "condition",
      type: "stopLoss",
      data: conditionData,
      ...defaultNodeProps,
    },
    {
      id: "swap",
      type: "swap",
      data: swapData,
      ...defaultNodeProps,
    },
    {
      id: "end",
      type: "endNode",
      selectable: false,
      ...defaultNodeProps,
    },
  ] as Node<INodeData>[];
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

export default function PlaygroundPage() {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const [initNodes, setInitNodes] = useState<Node<INodeData>[]>([]);

  useEffect(() => {
    createInitNodes(chainId as ChainId, safeAddress as Address).then(
      (nodes) => {
        setInitNodes(nodes);
      }
    );
  }, [chainId, safeAddress]);

  if (initNodes.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="hidden h-full flex-col md:flex text-white">
      <ReactFlowProvider>
        <div className="container size-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_300px]">
            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
              <Menu />
            </div>
            <div className="md:order-1">
              <div className="flex h-full flex-col space-y-4">
                <div className="h-full">
                  <Board initNodes={initNodes} initEdges={initEdges} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ReactFlowProvider>
    </div>
  );
}
