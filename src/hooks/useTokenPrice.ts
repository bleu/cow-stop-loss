import useSWR from "swr";

import { fetchTokenUsdPrice } from "#/lib/tokenUtils";
import { IToken } from "#/lib/types";

import { useSafeApp } from "./useSafeApp";

export function useTokenPrice(token?: IToken) {
  const { chainId } = useSafeApp();

  const { data, error } = useSWR(
    token ? ["tokenPrice", token.address, chainId] : null,
    () =>
      token
        ? fetchTokenUsdPrice({
            tokenAddress: token.address,
            tokenDecimals: token.decimals,
            chainId,
          })
        : null,
    {
      revalidateOnFocus: false,
      refreshInterval: 10_000,
    },
  );

  return {
    data,
    isLoading: !error && !data,
    error,
  };
}
