import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { useEffect } from "react";
import useSWR from "swr";
import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { useTxManager } from "#/hooks/useTxManager";
import { getProcessedStopLossOrders } from "#/lib/ponderApi/fetchOrders";
import { ChainId } from "#/lib/publicClients";
import { StopLossOrderType } from "#/lib/types";

interface OrderState {
  orders: StopLossOrderType[];
}

interface OrderActions {
  setOrders: (orders: StopLossOrderType[]) => void;
}

const useOrderStore = create<OrderState & OrderActions>()(
  persist(
    (set) => ({
      orders: [],
      setOrders: (orders) => set({ orders }),
    }),
    {
      name: "order-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useOrderList() {
  const { safe } = useSafeAppsSDK();
  const setOrders = useOrderStore((state) => state.setOrders);
  const txManager = useTxManager();

  const { error, isValidating, mutate } = useSWR(
    {
      chainId: safe.chainId as ChainId,
      userAddress: safe.safeAddress as Address,
    },
    getProcessedStopLossOrders,
    {
      onSuccess: (data) => setOrders(data),
    },
  );

  useEffect(() => {
    if (!txManager.isPonderUpdating) {
      mutate();
    }
  }, [txManager.isPonderUpdating, mutate]);

  const orders = useOrderStore((state) => state.orders);

  return {
    orders,
    isLoading: isValidating,
    error,
    mutate,
  };
}
