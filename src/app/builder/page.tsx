"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { Node, useNodes } from "reactflow";
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

export default function Page() {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const [initNodes, setInitNodes] = useState<Node<INodeData>[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const nodes = useNodes();

  useEffect(() => {
    createInitNodes(chainId as ChainId, safeAddress as Address).then(
      (nodes) => {
        setInitNodes(nodes);
      }
    );
  }, [chainId, safeAddress]);

  useEffect(() => {
    setMenuVisible(nodes.some((node) => node.selected));
  }, [nodes]);

  if (initNodes.length === 0) {
    return <Spinner />;
  }

  return (
    <div className="hidden h-full flex-col md:flex text-white">
      <div className="container size-full py-6">
        <div className="flex h-full items-stretch gap-6">
          <div
            className={`flex-col space-y-4 sm:flex md:order-2 transition-all duration-500 ${menuVisible ? "w-72 translate-x-0" : "w-0 translate-x-full"}`}
          >
            {menuVisible && <Menu />}
          </div>
          <div className={`flex flex-col flex-1`}>
            <div className="flex h-full flex-col space-y-4">
              <div className="h-full">
                <Board initNodes={initNodes} initEdges={initEdges} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
