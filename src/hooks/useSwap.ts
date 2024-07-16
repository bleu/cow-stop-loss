// hooks/useSwap.ts
import { useCallback, useState } from "react";

import { CHAINS_ORACLE_ROUTER_FACTORY, IRoute } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { fetchPairUsdPrice } from "#/lib/tokenUtils";
import {
  AdvancedSwapSettings,
  DraftOrder,
  IToken,
  SwapData,
} from "#/lib/types";
import { generateRandomHex } from "#/utils";

import { useSafeApp } from "./useSafeApp";

export function useSwap() {
  const { chainId } = useSafeApp();
  const [isLoading, setIsLoading] = useState(false);
  const [oracleRoute, setOracleRoute] = useState<IRoute | null>(null);

  const updateOracle = useCallback(
    async (tokenSell?: IToken, tokenBuy?: IToken) => {
      if (!tokenSell || !tokenBuy) return;
      setIsLoading(true);
      const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
      const oracleRouter = new oracleRouterClass({
        chainId,
        tokenBuy,
        tokenSell,
      });
      try {
        const route = await oracleRouter.findRoute();
        setOracleRoute(route);
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error("Error finding oracle route:", error);
        setOracleRoute(null);
      }
      setIsLoading(false);
    },
    [chainId],
  );

  const createDraftOrder = useCallback(
    async (
      data: SwapData,
      advancedSettings: AdvancedSwapSettings,
    ): Promise<DraftOrder> => {
      let tokenBuyOracle = advancedSettings.tokenBuyOracle;
      let tokenSellOracle = advancedSettings.tokenSellOracle;

      if (!tokenBuyOracle || !tokenSellOracle) {
        if (!oracleRoute) {
          throw new Error("No route found");
        }
        tokenBuyOracle = oracleRoute.tokenBuyOracle;
        tokenSellOracle = oracleRoute.tokenSellOracle;
      }

      if (!tokenBuyOracle || !tokenSellOracle) {
        throw new Error("Oracle not found");
      }

      const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
      const oracleRouter = new oracleRouterClass({
        chainId,
        tokenBuy: data.tokenBuy,
        tokenSell: data.tokenSell,
      });

      const oraclePrice = await oracleRouter.calculatePrice({
        tokenBuyOracle,
        tokenSellOracle,
      });

      const fallbackMarketPrice = await fetchPairUsdPrice({
        sellToken: data.tokenSell,
        buyToken: data.tokenBuy,
        chainId: chainId as ChainId,
      });

      const timestamp = Date.now().toString(16);
      const randomPart = generateRandomHex(64 - timestamp.length);
      const salt = `0x${timestamp}${randomPart}` as `0x${string}`;

      const draftOrder: DraftOrder = {
        ...data,
        ...advancedSettings,
        tokenBuyOracle,
        tokenSellOracle,
        id: `draft-${Date.now()}`,
        oraclePrice,
        fallbackMarketPrice,
        salt,
      };

      return draftOrder;
    },
    [chainId, oracleRoute],
  );

  return {
    createDraftOrder,
    updateOracle,
    isLoading,
    oracleRoute,
  };
}
