import useSWR from "swr";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { fetchOraclePairPrice } from "#/lib/oraclePrice";
import {
  configuredRouteMaxAges,
  configuredTokenRoute,
  type IRoute,
} from "#/lib/oracleRouter";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useAdvancedSettingsStore } from "./useAdvancedSettings";

export const useTokenPairPrice = (
  tokenSell?: IToken,
  tokenBuy?: IToken,
  tokenChainId?: ChainId,
  savedOracles?: {
    tokenSellOracle: Address;
    tokenBuyOracle: Address;
    maxAge: number;
  },
) => {
  const { chainId: accountChainId } = useAccount();
  const chainId = tokenChainId ?? ((accountChainId ?? 1) as ChainId);
  const maxHours = useAdvancedSettingsStore(
    (state) => state.advancedSettings.maxHoursSinceOracleUpdates,
  );
  let maxAge = savedOracles?.maxAge ?? maxHours * 60 * 60;
  let sellMaxAge = maxAge;
  let buyMaxAge = maxAge;
  let route: IRoute | undefined;
  let routeError: Error | undefined;
  if (chainId && tokenSell && tokenBuy) {
    try {
      const pair = { chainId, tokenSell, tokenBuy };
      route = savedOracles ?? configuredTokenRoute(pair);
      if (!savedOracles) {
        const limits = configuredRouteMaxAges(pair);
        sellMaxAge = Math.min(maxAge, limits.sellMaxAge);
        buyMaxAge = Math.min(maxAge, limits.buyMaxAge);
        maxAge = Math.max(sellMaxAge, buyMaxAge);
      }
    } catch (error) {
      routeError =
        error instanceof Error ? error : new Error("No matching oracles found");
    }
  }
  const result = useSWR(
    chainId && route
      ? ([
          "oracle-pair-price",
          chainId,
          route.tokenSellOracle.toLowerCase(),
          route.tokenBuyOracle.toLowerCase(),
          maxAge,
          sellMaxAge,
          buyMaxAge,
        ] as const)
      : null,
    ([
      ,
      selectedChainId,
      tokenSellOracle,
      tokenBuyOracle,
      selectedMaxAge,
      selectedSellMaxAge,
      selectedBuyMaxAge,
    ]) =>
      fetchOraclePairPrice({
        chainId: selectedChainId,
        route: {
          tokenSellOracle: tokenSellOracle as Address,
          tokenBuyOracle: tokenBuyOracle as Address,
        },
        maxAge: selectedMaxAge,
        sellMaxAge: selectedSellMaxAge,
        buyMaxAge: selectedBuyMaxAge,
      }),
    {
      refreshInterval: 90_000,
      shouldRetryOnError: true,
      errorRetryInterval: 90_000,
    },
  );
  const error = routeError ?? result.error;
  return {
    data: error ? undefined : result.data,
    error,
    isLoading: result.isLoading,
  };
};
