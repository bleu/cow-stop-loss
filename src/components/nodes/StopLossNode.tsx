import { memo } from "react";
import { BaseNode } from ".";
import { IStopLossConditionData } from "@/lib/types";

function StopLossNode({
  selected,
  data,
}: {
  selected: boolean;
  data: IStopLossConditionData;
}) {
  return (
    <BaseNode selected={selected} isStart>
      <div className="flex flex-col">
        <span className="text-md font-bold">Stop Loss</span>
        <span className="text-sm text-gray-500">
          Sell {data.tokenSell.symbol} if price falls below {data.strikePrice}{" "}
          {data.tokenBuy.symbol}
        </span>
      </div>
    </BaseNode>
  );
}

export default memo(StopLossNode);
