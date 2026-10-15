import useSWR from "swr";
import { useAccount } from "wagmi";

import { ChainId } from "#/lib/publicClients";
import { fetchTokenUsdPrice } from "#/lib/tokenUtils";
import { IToken } from "#/lib/types";

export function useTokenPrice(token?: IToken, tokenChainId?: ChainId) {
  const { chainId: accountChainId } = useAccount();
  const chainId = tokenChainId ?? ((accountChainId ?? 1) as ChainId);

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
      keepPreviousData: false,
      revalidateOnFocus: false,
      refreshInterval: 10_000,
    },
  );

  const price =
    typeof data === "number" && Number.isFinite(data) && data > 0
      ? data
      : undefined;

  return {
    data: price,
    isLoading: !error && !data,
    error,
  };
}
