import { formatNumber } from "@bleu-fi/ui";
import { Cross1Icon } from "@radix-ui/react-icons";
import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect, useState } from "react";
import { useReactFlow } from "reactflow";

import { useBuilder } from "#/contexts/builder";
import { fetchPairUsdPrice } from "#/lib/fetchTokenUsdPrice";
import { ChainId } from "#/lib/publicClients";
import { IStopLossConditionData } from "#/lib/types";

import { InfoTooltip } from "../Tooltip";
import { BaseNode } from ".";

const STOP_LOSS_ERROR_MESSSAGE = {
  STRIKE_PRICE_ABOVE_ORACLE_PRICE: "Strike price is above the oracle price",
  ORACLE_NOT_FOUND: "Oracle contract not found",
};

const STOP_LOSS_WARNING_MESSAGE = {
  DIFF_FROM_MARKET_PRICE:
    "Warning: Oracle Price is more than 10% different from market price",
  MARKET_PRICE_NOT_FOUND:
    "Warning: Market price not found for the provided tokens",
  ORACLE_NOT_FOUND: "Warning: Oracle price not found",
} as const;

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
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const { getOrderDataByOrderId, ordersData } = useBuilder();
  const [warning, setWarning] = useState<string>();
  const recipeData = getOrderDataByOrderId(data.orderId);
  const deleteButtonDisabled = ordersData?.length === 1;

  useEffect(() => {
    if (recipeData) {
      fetchPairUsdPrice({
        baseToken: recipeData?.tokenSell,
        quoteToken: recipeData?.tokenBuy,
        chainId: chainId as ChainId,
      })
        .then((price) => {
          if (!data.currentOraclePrice) {
            setWarning(STOP_LOSS_WARNING_MESSAGE.ORACLE_NOT_FOUND);
            return;
          }
          const percentageDiff =
            (price - (data.currentOraclePrice || 0)) / price;

          if (Math.abs(percentageDiff) > 0.1) {
            setWarning(STOP_LOSS_WARNING_MESSAGE.DIFF_FROM_MARKET_PRICE);
            return;
          }
          setWarning(undefined);
        })
        .catch(() => {
          setWarning(STOP_LOSS_WARNING_MESSAGE.MARKET_PRICE_NOT_FOUND);
        });
    }
  }, [data, recipeData]);

  return (
    <BaseNode selected={selected} isStart>
      <div className="flex flex-col">
        <div className="w-full flex flex-row justify-between items-center">
          <div className="flex flex-row gap-2 items-center">
            <span className="text-sm font-bold text-highlight">
              Stop Loss Condition
            </span>
            {data.error && (
              <InfoTooltip
                text={STOP_LOSS_ERROR_MESSSAGE[data.error]}
                link={"https://data.chain.link/feeds"}
                variant="error"
                side="bottom"
              />
            )}
            {!data.error && warning && (
              <InfoTooltip text={warning} variant="error" side="bottom" />
            )}
          </div>
          {!deleteButtonDisabled && (
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
