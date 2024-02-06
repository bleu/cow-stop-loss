import { memo } from "react";
import { BaseNode } from ".";
import { ISwapData } from "@/lib/types";

function StopLossNode({
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
          <div className="text-md font-bold">Swap</div>
          <div className="text-sm text-gray-500">
            {data.isSellOrder
              ? `Sell ${data.sellAmount} ${data.tokenSell.symbol} for at least ${data.buyAmount} ${data.tokenBuy.symbol}`
              : `Buy ${data.buyAmount} ${data.tokenBuy.symbol} for maximum of ${data.sellAmount} ${data.tokenSell.symbol}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(StopLossNode);
