import { TransactionStatus } from "@safe-global/safe-apps-sdk";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { DraftOrder, OrderStatus } from "#/lib/types";

import { useSafeApp } from "./useSafeApp";

interface DraftOrdersState {
  draftOrders: DraftOrder[];
}

interface DraftOrdersActions {
  setDraftOrders: (orders: DraftOrder[]) => void;
  addDraftOrders: (orders: DraftOrder[]) => void;
  removeDraftOrders: (id: string[]) => void;
  changeOrderStatus: (
    ids: string[],
    txHash: `0x${string}`,
    status: OrderStatus
  ) => void;
}

const useDraftOrderStore = create<DraftOrdersState & DraftOrdersActions>()(
  persist(
    (set) => ({
      draftOrders: [],
      setDraftOrders: (draftOrders) => set({ draftOrders }),
      addDraftOrders: (orders) =>
        set((state) => ({
          draftOrders: [...orders, ...state.draftOrders],
        })),
      removeDraftOrders: (ids) =>
        set((state) => ({
          draftOrders: state.draftOrders.filter(
            (order) => !ids.includes(order.id)
          ),
        })),
      changeOrderStatus: (ids, safeTxHash, status) =>
        set((state) => ({
          draftOrders: state.draftOrders.map((order) => {
            if (ids.includes(order.id)) {
              return {
                ...order,
                status: status,
                safeTxHash: safeTxHash,
              };
            }
            return order;
          }),
        })),
    }),
    {
      name: "draft-orders-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export const useDraftOrders = () => {
  const [
    draftOrders,
    setDraftOrders,
    removeDraftOrders,
    changeOrderStatus,
    addDraftOrders,
  ] = useDraftOrderStore((state) => [
    state.draftOrders,
    state.setDraftOrders,
    state.removeDraftOrders,
    state.changeOrderStatus,
    state.addDraftOrders,
  ]);

  const { sdk } = useSafeApp();

  const updateCreatingOrder = async (order: DraftOrder) => {
    if (!order.safeTxHash) return;
    const safeTx = await sdk.txs.getBySafeTxHash(order.safeTxHash);
    if (
      [
        TransactionStatus.SUCCESS,
        TransactionStatus.FAILED,
        TransactionStatus.CANCELLED,
      ].includes(safeTx.txStatus)
    ) {
      removeDraftOrders([order.id]);
    } else {
      changeOrderStatus([order.id], order.safeTxHash, safeTx.txStatus);
    }
  };

  const checkCreatingOrders = async () => {
    const creatingOrders = draftOrders.filter((order) => order.safeTxHash);
    creatingOrders.forEach(updateCreatingOrder);
  };

  useEffect(() => {
    checkCreatingOrders();
    const interval = setInterval(checkCreatingOrders, 5000);
    return () => clearInterval(interval);
  }, [draftOrders]);

  return {
    draftOrders,
    setDraftOrders,
    addDraftOrders,
    removeDraftOrders,
    changeOrderStatus,
  };
};
