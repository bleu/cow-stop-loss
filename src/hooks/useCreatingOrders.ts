import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { CreatingOrder } from "#/lib/types";

interface CreatingOrdersState {
  creatingOrders: CreatingOrder[];
}

interface CreatingOrdersActions {
  addCreatingOrders: (orders: CreatingOrder[]) => void;
  removeCreatingOrders: (safeTxHashs: `0x${string}`[]) => void;
}

export const useCreatingOrders = create<
  CreatingOrdersState & CreatingOrdersActions
>()(
  persist(
    (set) => ({
      creatingOrders: [],
      addCreatingOrders: (orders) =>
        set((state) => ({
          creatingOrders: [...state.creatingOrders, ...orders],
        })),
      removeCreatingOrders: (safeTxHashs) => {
        set((state) => ({
          creatingOrders: state.creatingOrders.filter(
            (order) => !safeTxHashs.includes(order.safeTxHash),
          ),
        }));
      },
    }),
    {
      name: "creating-orders-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
