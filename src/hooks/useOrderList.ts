import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAccount } from "wagmi";

import { loadStopLossOrders } from "#/lib/stopLossOrders";

export function useOrderList() {
  const { address } = useAccount();
  const queryClient = useQueryClient();
  const queryKey = ["stop-loss-orders", address?.toLowerCase()];
  const query = useQuery({
    queryKey,
    queryFn: async ({ signal }) => {
      const result = await loadStopLossOrders({ account: address!, signal });
      const previous =
        queryClient.getQueryData<
          Awaited<ReturnType<typeof loadStopLossOrders>>
        >(queryKey);
      return {
        ...result,
        chains: result.chains.map((chain) =>
          chain.status === "error"
            ? {
                ...chain,
                orders:
                  previous?.chains.find((old) => old.chainId === chain.chainId)
                    ?.orders ?? [],
              }
            : chain,
        ),
      };
    },
    enabled: !!address,
    gcTime: 0,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    retry: false,
  });

  const orders = useMemo(
    () => query.data?.chains.flatMap((chain) => chain.orders) ?? [],
    [query.data],
  );

  return {
    orders,
    chains: query.data?.chains ?? [],
    isLoading: query.isFetching,
    error: query.error,
    mutate: query.refetch,
  };
}
