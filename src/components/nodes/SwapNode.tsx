import { Address } from "viem";

import { cowTokenList } from "#/lib/cowTokenList";
import { ISwapData, IToken, TIME_OPTIONS } from "#/lib/types";

import { BaseNode } from ".";

export function SwapNode({
  selected,
  data,
}: {
  selected: boolean;
  data: ISwapData;
}) {
  return (
    <BaseNode selected={selected} isEnd>
      <div className="flex">
        <div className="ml-2">
          <div className="text-sm font-bold">Swap</div>
          <div className="text-xs text-gray-500">
            {`${data.isSellOrder ? "Sell" : "Buy"} ${data.amount} ${
              data.tokenSell.symbol
            } for ${data.tokenBuy.symbol}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export const getDefaultSwapData = (chainId: number, safeAddress: Address) =>
  ({
    tokenSell: cowTokenList.findLast(
      (token) => token.symbol === "WETH" && token.chainId === chainId
    ) as IToken,
    tokenBuy: cowTokenList.findLast(
      (token) => token.symbol === "USDC" && token.chainId === chainId
    ) as IToken,
    amount: 0.1,
    allowedSlippage: 1,
    isSellOrder: true,
    validityBucketTime: TIME_OPTIONS.HOUR,
    isPartiallyFillable: false,
    receiver: safeAddress,
  }) as ISwapData;
