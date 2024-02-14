"use client";

import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { useState } from "react";
import { Node, ReactFlowProvider } from "reactflow";
import { Address } from "viem";

import Board from "#/components/Board";
import Menu from "#/components/menus";
import { defaultStopLossData } from "#/components/nodes/StopLossNode";
import { getDefaultSwapData } from "#/components/nodes/SwapNode";
import { Separator } from "#/components/ui/separator";
import { INodeData, IStopLossRecipeData } from "#/lib/types";

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<Node<INodeData>>();

  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();

  const [data, setData] = useState<IStopLossRecipeData>({
    ...getDefaultSwapData(chainId, safeAddress as Address),
    ...defaultStopLossData,
    preHooks: [],
  });

  return (
    <ReactFlowProvider>
      <div className="hidden h-full flex-col md:flex text-white">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Stop Loss</h2>
        </div>
        <Separator />
        <div className="container size-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_300px]">
            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
              <Menu
                selected={selected}
                data={data}
                setData={setData}
                setSelected={setSelected}
              />
            </div>
            <div className="md:order-1">
              <div className="flex h-full flex-col space-y-4">
                <div className="h-[80vh]">
                  <Board setSelected={setSelected} data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
