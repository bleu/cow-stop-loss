import { tomatoDark } from "@radix-ui/colors";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { IStopLossConditionData, IToken, TIME_OPTIONS } from "#/lib/types";

import { Tooltip } from "../Tooltip";
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
        <div className="flex flex-row gap-2  items-center">
          <span className="text-sm font-bold">Stop Loss Condition</span>
          {data.oracleError && (
            <a href={"https://data.chain.link/feeds"} target="_blank">
              <Tooltip content="Chainlink Oracle not found for selected tokens.">
                <ExclamationTriangleIcon
                  className="size-3"
                  color={tomatoDark.tomato10}
                />
              </Tooltip>
            </a>
          )}
        </div>
        <span className="text-xs text-gray-500">
          If the sell token price falls bellow {data.strikePrice}
        </span>
      </div>
    </BaseNode>
  );
}

export const getDefaultStopLossData = async ({
  chainId,
  tokenBuy,
  tokenSell,
}: {
  chainId: ChainId;
  tokenSell: IToken;
  tokenBuy: IToken;
}): Promise<IStopLossConditionData> => {
  const router = new CHAINS_ORACLE_ROUTER_FACTORY[chainId]({
    chainId,
    tokenBuy,
    tokenSell,
  });
  const route = await router.findRoute();
  const strikePrice = await router.calculatePrice(route);

  return {
    strikePrice,
    tokenSellOracle: route.tokenSellOracle,
    tokenBuyOracle: route.tokenBuyOracle,
    maxTimeSinceLastOracleUpdate: TIME_OPTIONS.YEAR,
  };
};
