import useSWR from "swr";
import type { Address } from "viem";
import { useAccount } from "wagmi";

import { fetchOraclePairPrice } from "#/lib/oraclePrice";
import {
  configuredRouteMaxAgeSeconds,
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
  let route: IRoute | undefined;
  let routeError: Error | undefined;
  if (chainId && tokenSell && tokenBuy) {
    try {
      const pair = { chainId, tokenSell, tokenBuy };
      route = savedOracles ?? configuredTokenRoute(pair);
      if (!savedOracles)
        maxAge = Math.min(maxAge, configuredRouteMaxAgeSeconds(pair));
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
        ] as const)
      : null,
    ([, selectedChainId, tokenSellOracle, tokenBuyOracle, selectedMaxAge]) =>
      fetchOraclePairPrice({
        chainId: selectedChainId,
        route: {
          tokenSellOracle: tokenSellOracle as Address,
          tokenBuyOracle: tokenBuyOracle as Address,
        },
        maxAge: selectedMaxAge,
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
