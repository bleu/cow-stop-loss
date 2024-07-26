import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import useSWRImmutable from "swr/immutable";
import { Address } from "viem";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getProcessedStopLossOrders } from "#/lib/ponderApi/fetchOrders";
import { ChainId } from "#/lib/publicClients";
import { OrderStatus, StopLossOrderType } from "#/lib/types";

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

  const { error, isValidating, mutate } = useSWRImmutable(
    {
      chainId: safe.chainId as ChainId,
      userAddress: safe.safeAddress as Address,
    },
    getProcessedStopLossOrders,
    {
      onSuccess: (data) => setOrders(data),
    },
  );

  const orders = useOrderStore((state) => state.orders);

  const changeOrdersStateToCancelling = (ordersIds: string[]) => {
    setOrders(
      orders.map((order) =>
        ordersIds.includes(order.id)
          ? { ...order, status: OrderStatus.CANCELLING }
          : order,
      ),
    );
  };

  return {
    orders,
    isLoading: isValidating,
    error,
    mutate,
    changeOrdersStateToCancelling,
  };
}
