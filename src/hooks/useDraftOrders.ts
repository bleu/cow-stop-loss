import { TransactionStatus } from "@safe-global/safe-apps-sdk";
import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { publicClientsFromIds } from "#/lib/publicClients";
import { DraftOrder, OrderStatus } from "#/lib/types";

import { usePonderState } from "./usePonderState";
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
  replaceOrder: (id: string, order: DraftOrder) => void;
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
      replaceOrder: (id, order) =>
        set((state) => ({
          draftOrders: state.draftOrders.map((o) => {
            if (o.id === id) {
              return order;
            }
            return o;
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
    replaceOrder,
  ] = useDraftOrderStore((state) => [
    state.draftOrders,
    state.setDraftOrders,
    state.removeDraftOrders,
    state.changeOrderStatus,
    state.addDraftOrders,
    state.replaceOrder,
  ]);

  const { ponderBlockNumber } = usePonderState();

  const { sdk, chainId } = useSafeApp();
  const publicClient = publicClientsFromIds[chainId];

  const updateCreatingOrder = async (order: DraftOrder) => {
    if (!order.safeTxHash) return;
    const safeTx = await sdk.txs.getBySafeTxHash(order.safeTxHash);

    // Order was cancelled or failed and can be removed
    if (
      [TransactionStatus.FAILED, TransactionStatus.CANCELLED].includes(
        safeTx.txStatus
      )
    ) {
      removeDraftOrders([order.id]);
      return;
    }

    // Transaction was successful
    if (TransactionStatus.SUCCESS === safeTx.txStatus) {
      const { blockNumber } = await publicClient.getTransaction({
        hash: safeTx.txHash as `0x${string}`,
      });

      // Order is on Ponder and and can be removed
      if (blockNumber > ponderBlockNumber) {
        removeDraftOrders([order.id]);
        return;
      }
    }

    // Update order status
    replaceOrder(order.id, {
      ...order,
      status: safeTx.txStatus,
    });
  };

  const updateCreatingOrders = async () => {
    const creatingOrders = draftOrders.filter((order) => order.safeTxHash);
    creatingOrders.forEach(updateCreatingOrder);
  };

  useEffect(() => {
    updateCreatingOrders();
    const interval = setInterval(updateCreatingOrders, 5000);
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
