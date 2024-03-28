import { formatNumber } from "@bleu-fi/ui";

import { IStopLossConditionData } from "#/lib/types";

import { InfoTooltip } from "../Tooltip";
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
        <div className="flex flex-row gap-2 items-center">
          <span className="text-sm font-bold text-highlight">
            Stop Loss Condition
          </span>
          
          {data.error && (
            <InfoTooltip text={data.error} link={"https://data.chain.link/feeds"} variant="error"/>
          )}
        </div>
        <span className="text-xs">
          If the sell token price falls bellow{" "}
          {formatNumber(data.strikePrice, 4, "decimal", "standard", 0.0001)}
        </span>
      </div>
    </BaseNode>
  );
}
