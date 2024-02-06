"use client";

import Board from "@/components/Board";

import { Separator } from "@bleu-fi/ui";
import { ReactFlowProvider } from "reactflow";
import { useState } from "react";
import { INode, IToken } from "@/lib/types";
import { cowTokenList } from "@/lib/utils/cowTokenList";

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<INode>({
    id: "1",
    type: "stopLoss",
    data: {
      strikePrice: "1000",
      tokenSell: cowTokenList.findLast(
        (token) => token.symbol === "WETH" && token.chainId === 1
      ) as IToken,
      tokenBuy: cowTokenList.findLast(
        (token) => token.symbol === "COW" && token.chainId === 1
      ) as IToken,
      tokenBuyOracle: "0x",
      tokenSellOracle: "0x",
      isSellOrder: true,
      isPartiallyFillable: false,
      sellAmount: "1",
      buyAmount: "1000",
      validityBucketTime: "15 minutes",
      maxTimeSinceLastOracleUpdate: "1 hour",
      appData: "0x",
      receiver: "0x",
    },
  });

  return (
    <ReactFlowProvider>
      <div className="hidden h-full flex-col md:flex">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Playground</h2>
          <div className="ml-auto flex w-full space-x-2 sm:justify-end"></div>
        </div>
        <Separator />
        <div className="container h-full py-6">
          <div className="grid h-full items-stretch gap-6 md:grid-cols-[1fr_200px]">
            <div className="hidden flex-col space-y-4 sm:flex md:order-2">
              {/* @ts-ignore */}
              {JSON.stringify(selected)}
            </div>
            <div className="md:order-1">
              <div className="flex h-full flex-col space-y-4">
                <div className="h-[80vh]">
                  <Board selected={selected} setSelected={setSelected} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  );
}
