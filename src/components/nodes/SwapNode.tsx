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
            {`${data.isSellOrder ? "Sell" : "Buy"} ${data.amount} ${
              data.tokenSell.symbol
            } for ${data.tokenBuy.symbol}`}
          </div>
        </div>
      </div>
    </BaseNode>
  );
}

export default memo(StopLossNode);
