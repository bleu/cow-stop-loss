import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import useSWR from "swr";

import { getProcessedStopLossOrders } from "#/lib/orderFetcher";
import { ChainId } from "#/lib/publicClients";

export const useOrderList = () => {
  const {
    safe: { chainId, safeAddress },
  } = useSafeAppsSDK();

  const {
    data: orders,
    error,
    mutate,
  } = useSWR(
    [chainId, safeAddress],
    ([cid, address]) =>
      getProcessedStopLossOrders({
        chainId: cid as ChainId,
        address: address as `0x${string}`,
      }),
    { refreshInterval: 60_000 }
  );

  const openOrders =
    orders?.filter(
      (order) => order.singleOrder && order.status !== "fulfilled"
    ) || [];

  const historyOrders =
    orders?.filter(
      (order) => !order.singleOrder || order.status === "fulfilled"
    ) || [];

  return {
    openOrders,
    historyOrders,
    error,
    isLoading: !error && !orders,
    mutate,
  };
};
