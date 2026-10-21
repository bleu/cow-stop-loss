import useSWR from "swr";
import type { Address } from "viem";

import type { ChainId } from "#/lib/publicClients";
import { fetchWalletTokenValues } from "#/lib/walletTokenValues";

export function useWalletTokenValues(
  chainId: ChainId,
  account?: Address,
  enabled = true,
) {
  const normalizedAccount = account?.toLowerCase() as Address | undefined;
  const result = useSWR(
    enabled
      ? ["walletTokenValues", chainId, normalizedAccount ?? "disconnected"]
      : null,
    () => fetchWalletTokenValues({ chainId, account: normalizedAccount }),
    {
      keepPreviousData: false,
      dedupingInterval: 30_000,
      refreshInterval: 30_000,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryInterval: 30_000,
      errorRetryCount: 3,
    },
  );
  return { ...result, data: result.error ? undefined : result.data };
}
