import { formatNumber } from "@bleu-fi/ui";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useReactFlow } from "reactflow";

import { useBuilder } from "#/contexts/builder";
import { IStopLossConditionData } from "#/lib/types";

import { InfoTooltip } from "../Tooltip";
import { BaseNode } from ".";

const STOP_LOSS_ERROR_MESSSAGE = {
  STRIKE_PRICE_ABOVE_ORACLE_PRICE: "Strike price is above the oracle price",
  ORACLE_NOT_FOUND: "Oracle contract not found",
};

export function StopLossNode({
  id,
  selected,
  data,
}: {
  id: string;
  selected: boolean;
  data: IStopLossConditionData;
}) {
  const { deleteElements } = useReactFlow();
  const { getOrderDataByOrderId, ordersData } = useBuilder();
  const recipeData = getOrderDataByOrderId(data.orderId);
  const deleteButtonDisabled = ordersData?.length === 1;
  return (
    <BaseNode selected={selected} isStart>
      <div className="flex flex-col">
        <div className="flex flex-row gap-2 items-center">
          <div className="w-full flex flex-row justify-between items-center">
            <span className="text-sm font-bold text-highlight">
              Stop Loss Condition
            </span>
            <button
              className={
                deleteButtonDisabled
                  ? "text-background/60"
                  : "text-background hover:text-destructive"
              }
              disabled={deleteButtonDisabled}
              onClick={() => {
                deleteElements({
                  nodes: [{ id }],
                });
              }}
            >
              <Cross1Icon className="size-3" />
            </button>
          </div>

          {data.error && (
            <InfoTooltip
              text={STOP_LOSS_ERROR_MESSSAGE[data.error]}
              link={"https://data.chain.link/feeds"}
              variant="error"
            />
          )}
        </div>
        <span className="text-xs">
          If the {recipeData?.tokenSell.symbol}/{recipeData?.tokenBuy.symbol}{" "}
          falls bellow{" "}
          {formatNumber(data.strikePrice, 4, "decimal", "standard", 0.0001)}
        </span>
      </div>
    </BaseNode>
  );
}
