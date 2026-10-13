import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";

import { supportedChainIds } from "#/lib/publicClients";
import { loadStopLossOrders } from "#/lib/stopLossOrders";
import { PlacementRow } from "#/lib/stopLossPlacement";

import {
  getStopLossPlacement,
  useStopLossPlacement,
} from "./useStopLossPlacement";

export function useOrderList() {
  const { address } = useAccount();
  const { records, error: placementError } = useStopLossPlacement(address);
  const account = address?.toLowerCase();
  const [merged, setMerged] = useState<{
    account?: string;
    rows: PlacementRow[];
    error?: string;
  }>({ rows: [] });
  const [indexDeadline, setIndexDeadline] = useState(0);
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
    refetchInterval: (current) =>
      records.some(
        (record) =>
          record.prepared.account.toLowerCase() === account &&
          record.status === "confirmed" &&
          !current.state.data?.chains.some(
            (chain) =>
              chain.chainId === record.prepared.chainId &&
              chain.orders.some(
                (order) =>
                  order.owner.toLowerCase() ===
                    record.prepared.owner.toLowerCase() &&
                  order.hash.toLowerCase() ===
                    record.prepared.paramsHash.toLowerCase(),
              ),
          ),
      )
        ? 15000
        : false,
    retry: false,
  });

  useEffect(() => {
    const now = Date.now();
    const deadlines = records
      .filter(
        (record) =>
          record.prepared.account.toLowerCase() === account &&
          record.status === "confirmed" &&
          record.confirmedAt !== undefined,
      )
      .map((record) => record.confirmedAt! + 300000)
      .filter((deadline) => deadline > now);
    if (!deadlines.length) return;
    const timer = setTimeout(
      () => setIndexDeadline((tick) => tick + 1),
      Math.min(...deadlines) - now,
    );
    return () => clearTimeout(timer);
  }, [account, records, indexDeadline]);

  useEffect(() => {
    if (!address) return;
    let stopped = false;
    const merge = async () => {
      try {
        const placement = getStopLossPlacement();
        const rows = await Promise.all(
          supportedChainIds.map((chainId) =>
            placement.mergeRows(
              { account: address, chainId },
              query.data?.chains.find((chain) => chain.chainId === chainId)
                ?.orders ?? [],
            ),
          ),
        );
        if (!stopped) setMerged({ account, rows: rows.flat() });
      } catch (cause) {
        if (stopped) return;
        const indexed = new Map<string, PlacementRow>();
        for (const order of query.data?.chains.flatMap(
          (chain) => chain.orders,
        ) ?? []) {
          const identity = `${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}`;
          if (!indexed.has(identity))
            indexed.set(identity, { ...order, source: "api", canLink: true });
        }
        setMerged({
          account,
          rows: [...indexed.values()],
          error:
            cause instanceof Error
              ? cause.message
              : "Saved placement is unavailable",
        });
      }
    };
    void merge();
    return () => {
      stopped = true;
    };
  }, [address, account, query.data, records, indexDeadline]);

  const orders = merged.account === account ? merged.rows : [];

  return {
    orders,
    chains: query.data?.chains ?? [],
    isLoading: query.isFetching,
    error: query.error,
    trackingError:
      placementError ?? (merged.account === account ? merged.error : undefined),
    mutate: query.refetch,
  };
}
