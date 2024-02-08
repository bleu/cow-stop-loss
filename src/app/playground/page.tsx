"use client";

import Board from "@/components/Board";

import { ReactFlowProvider } from "reactflow";
import { useState } from "react";
import { INode, IStopLossRecipeData, IToken } from "@/lib/types";
import { cowTokenList } from "@/lib/cowTokenList";
import Menu from "@/components/menus";
import { Separator } from "@/components/ui/separator";

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<INode>();

  const [data, setData] = useState<IStopLossRecipeData>({
    strikePrice: 1000,
    tokenSell: cowTokenList.findLast(
      (token) => token.symbol === "WETH" && token.chainId === 11155111
    ) as IToken,
    tokenBuy: cowTokenList.findLast(
      (token) => token.symbol === "USDC" && token.chainId === 11155111
    ) as IToken,
    tokenBuyOracle: "0x",
    tokenSellOracle: "0x",
    isSellOrder: true,
    isPartiallyFillable: false,
    amount: 5000,
    validityBucketTime: "15 minutes",
    maxTimeSinceLastOracleUpdate: "1 hour",
    allowedSlippage: 1,
    receiver: "0x",
  });

  return (
    <ReactFlowProvider>
      <div className="hidden h-full flex-col md:flex text-white">
        <div className="container flex flex-col items-start justify-between space-y-2 py-4 sm:flex-row sm:items-center sm:space-y-0 md:h-16">
          <h2 className="text-lg font-semibold">Stop Loss</h2>
        </div>
        <Separator />
        <div className="container h-full w-full py-6">
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
