import useSWR from "swr";
import type { Address } from "viem";

import { fetchOracleUsdPrice } from "#/lib/oraclePrice";
import type { ChainId } from "#/lib/publicClients";

export function useOraclePrice(
  chainId: ChainId,
  oracle?: Address,
  maxAge = 24 * 60 * 60,
) {
  const result = useSWR(
    oracle ? ["oraclePrice", chainId, oracle.toLowerCase(), maxAge] : null,
    () =>
      oracle ? fetchOracleUsdPrice({ chainId, oracle, maxAge }) : undefined,
    {
      keepPreviousData: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      shouldRetryOnError: true,
      errorRetryInterval: 30_000,
      errorRetryCount: 3,
      refreshInterval: 30_000,
    },
  );
  return { ...result, data: result.error ? undefined : result.data };
}
