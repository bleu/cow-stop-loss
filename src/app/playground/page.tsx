"use client";

import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { useState } from "react";
import { ReactFlowProvider } from "reactflow";

import Board from "#/components/Board";
import Menu from "#/components/menus";
import { Separator } from "#/components/ui/separator";
import { cowTokenList } from "#/lib/cowTokenList";
import {
  Address,
  INode,
  IStopLossRecipeData,
  IToken,
  TIME_OPTIONS,
} from "#/lib/types";

export default function PlaygroundPage() {
  const [selected, setSelected] = useState<INode>();

  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();

  const [data, setData] = useState<IStopLossRecipeData>({
    strikePrice: 50,
    tokenSell: cowTokenList.findLast(
      (token) => token.symbol === "WETH" && token.chainId === chainId,
    ) as IToken,
    tokenBuy: cowTokenList.findLast(
      (token) => token.symbol === "USDC" && token.chainId === chainId,
    ) as IToken,
    tokenSellOracle: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
    tokenBuyOracle: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
    isSellOrder: true,
    isPartiallyFillable: false,
    amount: 1,
    validityBucketTime: TIME_OPTIONS.HOUR,
    maxTimeSinceLastOracleUpdate: TIME_OPTIONS.HOUR,
    allowedSlippage: 1,
    receiver: safeAddress as Address,
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
