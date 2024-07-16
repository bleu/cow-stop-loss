import { create } from "zustand";
import { createJSONStorage, persist, PersistOptions } from "zustand/middleware";

import { DraftOrder } from "#/lib/types";

interface DraftOrdersState {
  draftOrders: DraftOrder[];
  addDraftOrders: (orders: DraftOrder[]) => void;
  removeDraftOrder: (id: string) => void;
  removeDraftOrders: (ids: string[]) => void;
  getDraftOrders: () => DraftOrder[];
  setDraftOrders: (orders: DraftOrder[]) => void;
}

type DraftOrdersPersist = Pick<DraftOrdersState, "draftOrders">;

type DraftOrdersPersistOptions = PersistOptions<
  DraftOrdersState,
  DraftOrdersPersist
>;

const persistOptions: DraftOrdersPersistOptions = {
  name: "draft-orders-storage",
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ draftOrders: state.draftOrders }),
};

export const useDraftOrders = create<DraftOrdersState>()(
  persist(
    (set, get) => ({
      draftOrders: [],
      addDraftOrders: (orders) =>
        set((state) => ({
          draftOrders: [...orders, ...state.draftOrders],
        })),
      removeDraftOrder: (id) =>
        set((state) => ({
          draftOrders: state.draftOrders.filter((order) => order.id !== id),
        })),
      removeDraftOrders: (ids) =>
        set((state) => ({
          draftOrders: state.draftOrders.filter(
            (order) => !ids.includes(order.id),
          ),
        })),
      getDraftOrders: () => get().draftOrders,
      setDraftOrders: (orders) => set({ draftOrders: orders }),
    }),
    persistOptions,
  ),
);
