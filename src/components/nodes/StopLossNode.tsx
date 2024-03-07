import { IStopLossConditionData, TIME_OPTIONS } from "#/lib/types";

import { BaseNode } from ".";

export function StopLossNode({
  selected,
  data,
}: {
  selected: boolean;
  data: IStopLossConditionData;
}) {
  return (
    <BaseNode selected={selected} isStart>
      <div className="flex flex-col">
        <span className="text-sm font-bold">Stop Loss Condition</span>
        <span className="text-xs text-gray-500">
          If the sell token price falls bellow {data.strikePrice}
        </span>
      </div>
    </BaseNode>
  );
}

export const defaultStopLossData: IStopLossConditionData = {
  strikePrice: 50,
  tokenSellOracle: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
  tokenBuyOracle: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
  maxTimeSinceLastOracleUpdate: TIME_OPTIONS.YEAR,
} as const;
