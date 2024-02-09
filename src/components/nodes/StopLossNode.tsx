import { memo } from "react";

import { IStopLossConditionData } from "#/lib/types";

import { BaseNode } from ".";

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
        <span className="text-md font-bold">Stop Loss Condition</span>
        <span className="text-sm text-gray-500">
          If the {data.tokenSell.symbol} price falls bellow to{" "}
          {data.strikePrice} {data.tokenBuy.symbol}
        </span>
      </div>
    </BaseNode>
  );
}

export default memo(StopLossNode);
