import { ISwapData } from "#/lib/types";

import { BaseNode } from ".";

export function SwapNode({
  selected,
  data,
}: {
  selected: boolean;
  data: ISwapData;
}) {
  return (
    <BaseNode selected={selected}>
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
