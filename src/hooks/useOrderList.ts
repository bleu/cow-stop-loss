import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { type Address, isHex } from "viem";
import { useAccount } from "wagmi";

import { composableCowAbi } from "#/lib/abis/composableCow";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { publicClientsFromIds, supportedChainIds } from "#/lib/publicClients";
import { loadStopLossOrders, type StopLossOrder } from "#/lib/stopLossOrders";
import { PlacementRow } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";

import {
  getSafeStopLossPlacement,
  useSafeStopLossPlacement,
} from "./useSafeStopLossPlacement";
import { useSafeOrderControls } from "./useStopLossApprovalRepair";
import {
  getStopLossPlacement,
  useStopLossPlacement,
} from "./useStopLossPlacement";

const cancellationKey = ["confirmed-stop-loss-cancellations"];
function cancellationFamily(account: string, order: StopLossOrder) {
  return `${account.toLowerCase()}:${order.chainId}:${order.owner.toLowerCase()}:${order.hash.toLowerCase()}`;
}
function cancellationIdentity(account: string, order: StopLossOrder) {
  return `${cancellationFamily(account, order)}:${order.parentId}`;
}

export function useCancellationOverlay() {
  const client = useQueryClient();
  type Execution = Pick<
    StopLossOrder,
    "executedSellAmount" | "executedBuyAmount" | "executedFee"
  > & { unindexed: boolean };
  const { data = {} } = useQuery<Record<string, Execution>>({
    queryKey: cancellationKey,
    initialData: {},
    enabled: false,
    gcTime: Infinity,
  });
  return useMemo(
    () => ({
      confirm(account: Address, order: StopLossOrder) {
        client.setQueryData<Record<string, Execution>>(
          cancellationKey,
          (previous) => ({
            ...previous,
            [cancellationIdentity(account, order)]: {
              executedSellAmount: order.executedSellAmount,
              executedBuyAmount: order.executedBuyAmount,
              executedFee: order.executedFee,
              unindexed:
                "source" in order &&
                (order.source === "local" || order.source === "safe"),
            },
          }),
        );
      },
      async reconcile(
        account: Address,
        orders: StopLossOrder[],
        signal: AbortSignal,
      ) {
        for (const order of orders) {
          const identity = cancellationIdentity(account, order);
          const local = Object.entries(data).find(
            ([key, entry]) =>
              entry.unindexed &&
              key !== identity &&
              key.startsWith(`${cancellationFamily(account, order)}:`),
          );
          if (!local || !isHex(order.hash) || order.hash.length !== 66)
            continue;
          const [localKey, entry] = local;
          try {
            const rpc = publicClientsFromIds[order.chainId];
            const blockNumber = await rpc.getBlockNumber({ cacheTime: 0 });
            const active = await rpc.readContract({
              address: COMPOSABLE_COW_ADDRESS,
              abi: composableCowAbi,
              functionName: "singleOrders",
              args: [order.owner, order.hash],
              blockNumber,
            });
            if (signal.aborted) return;
            client.setQueryData<Record<string, Execution>>(
              cancellationKey,
              (previous) => {
                if (previous?.[localKey] !== entry) return previous;
                return {
                  ...previous,
                  [localKey]: { ...entry, unindexed: false },
                  ...(!active
                    ? { [identity]: { ...entry, unindexed: false } }
                    : {}),
                };
              },
            );
          } catch {
            // Keep the confirmed state until the API identity can be checked.
          }
        }
      },
      apply<T extends StopLossOrder>(account: string, order: T): T {
        const confirmed =
          data[cancellationIdentity(account, order)] ??
          Object.entries(data).find(
            ([key, entry]) =>
              entry.unindexed &&
              key.startsWith(`${cancellationFamily(account, order)}:`),
          )?.[1];
        if (!confirmed || order.status === OrderStatus.FULFILLED) return order;
        const latest = (current: bigint | null, previous: bigint | null) =>
          current === null
            ? previous
            : previous !== null && previous > current
              ? previous
              : current;
        const executedSellAmount = latest(
          order.executedSellAmount,
          confirmed.executedSellAmount,
        );
        const executedBuyAmount = latest(
          order.executedBuyAmount,
          confirmed.executedBuyAmount,
        );
        const executedFee = latest(order.executedFee, confirmed.executedFee);
        const partial =
          (executedSellAmount ?? BigInt(0)) > BigInt(0) ||
          (executedBuyAmount ?? BigInt(0)) > BigInt(0);
        return {
          ...order,
          executedSellAmount,
          executedBuyAmount,
          executedFee,
          status: partial
            ? OrderStatus.PARTIALLY_FILLED_AND_CANCELLED
            : OrderStatus.CANCELLED,
        };
      },
    }),
    [client, data],
  );
}

export function useOrderList() {
  const overlay = useCancellationOverlay();
  const { address } = useAccount();
  const { records, error: placementError } = useStopLossPlacement(address);
  const { records: safeRecords, error: safePlacementError } =
    useSafeStopLossPlacement(address);
  const { records: safeControls, error: safeControlsError } =
    useSafeOrderControls(address);
  const [restoredControls] = useState(() => new Set<string>());
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
      await overlay.reconcile(
        address!,
        result.chains.flatMap((chain) => chain.orders),
        signal,
      );
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
      [
        ...records,
        ...safeRecords.filter(
          (record) =>
            record.prepared.draft.validTo > Math.floor(Date.now() / 1000),
        ),
      ].some(
        (record) =>
          record.prepared.account.toLowerCase() === account &&
          (record.status === "confirmed" || record.status === "paused") &&
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
    if (!address) return;
    for (const record of safeControls) {
      if (
        record.account.toLowerCase() !== account ||
        record.action !== "cancel" ||
        record.status !== "confirmed" ||
        restoredControls.has(record.id)
      )
        continue;
      restoredControls.add(record.id);
      overlay.confirm(address, record.order);
    }
    const controller = new AbortController();
    void overlay.reconcile(
      address,
      query.data?.chains.flatMap((chain) => chain.orders) ?? [],
      controller.signal,
    );
    return () => controller.abort();
  }, [address, account, safeControls, restoredControls, overlay, query.data]);

  useEffect(() => {
    const now = Date.now();
    const deadlines = [
      ...records
        .filter(
          (record) =>
            record.prepared.account.toLowerCase() === account &&
            record.status === "confirmed" &&
            record.confirmedAt !== undefined,
        )
        .map((record) => record.confirmedAt! + 300000),
      ...safeRecords
        .filter((record) => record.prepared.account.toLowerCase() === account)
        .map((record) => record.prepared.draft.validTo * 1000),
    ].filter((deadline) => deadline > now);
    if (!deadlines.length) return;
    const timer = setTimeout(
      () => setIndexDeadline((tick) => tick + 1),
      Math.min(Math.min(...deadlines) - now, 2147483647),
    );
    return () => clearTimeout(timer);
  }, [account, records, safeRecords, indexDeadline]);

  useEffect(() => {
    if (!address) return;
    let stopped = false;
    const merge = async () => {
      try {
        const placement = getStopLossPlacement();
        const rows = await Promise.all(
          supportedChainIds.map(async (chainId) => {
            const scope = { account: address, chainId };
            const chain = query.data?.chains.find(
              (chain) => chain.chainId === chainId,
            );
            const safePlacement = getSafeStopLossPlacement();
            if (chain?.status === "success")
              await safePlacement.reconcile(scope, chain.orders);
            const indexed = await placement.mergeRows(
              scope,
              chain?.orders ?? [],
            );
            return safePlacement.mergeRows(scope, indexed);
          }),
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
  }, [address, account, query.data, records, safeRecords, indexDeadline]);

  const orders = merged.account === account ? merged.rows : [];
  const projectedOrders = useMemo(
    () => orders.map((order) => overlay.apply(account!, order)),
    [orders, account, overlay],
  );
  const chains = useMemo(
    () =>
      (query.data?.chains ?? []).map((chain) => ({
        ...chain,
        orders: chain.orders.map((order) => overlay.apply(account!, order)),
      })),
    [query.data, account, overlay],
  );

  return {
    orders: projectedOrders,
    chains,
    isLoading: query.isFetching,
    error: query.error,
    trackingError:
      placementError ??
      safePlacementError ??
      safeControlsError ??
      (merged.account === account ? merged.error : undefined),
    mutate: query.refetch,
  };
}
