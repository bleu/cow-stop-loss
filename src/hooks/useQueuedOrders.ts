import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import useSWR from "swr";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { fetchCreateQueuedOrders } from "#/lib/txQueue/fetchCreateQueuedOrders";
import { StopLossOrderType } from "#/lib/types";

interface OrderQueueState {
  ordersQueue: StopLossOrderType[];
}

interface OrderQueueActions {
  setOrdersQueue: (ordersQueue: StopLossOrderType[]) => void;
}

const useOrderQueueStore = create<OrderQueueState & OrderQueueActions>()(
  persist(
    (set) => ({
      ordersQueue: [],
      setOrdersQueue: (ordersQueue) => set({ ordersQueue }),
    }),
    {
      name: "queued-orders-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useQueuedTxs() {
  const { safe } = useSafeAppsSDK();
  const setOrdersQueue = useOrderQueueStore((state) => state.setOrdersQueue);

  const { error, isValidating, mutate } = useSWR(
    {
      chainId: safe.chainId,
      address: safe.safeAddress,
    },
    fetchCreateQueuedOrders,
    {
      onSuccess: (data) => setOrdersQueue(data),
    },
  );

  const ordersOnQueue = useOrderQueueStore((state) => state.ordersQueue);

  return {
    ordersOnQueue,
    isLoading: isValidating,
    error,
    mutate,
  };
}
