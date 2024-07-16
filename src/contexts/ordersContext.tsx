"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import useSWR from "swr";
import { Address } from "viem";

import { useTxManager } from "#/hooks/useTxManager";
import { getProcessedStopLossOrders } from "#/lib/orderFetcher";
import { ChainId } from "#/lib/publicClients";
import { DraftOrder, StopLossOrderType } from "#/lib/types";

type OrderContextType = {
  draftOrders: DraftOrder[];
  setDraftOrders: (orders: DraftOrder[]) => void;
  addDraftOrders: (orders: DraftOrder[]) => void;
  removeDraftOrders: (id: string[]) => void;
  changeDraftOrdersStatusToCreating: (id: string[]) => void;
  orders: StopLossOrderType[];
  isLoading: boolean;
  error: boolean;
  mutate: () => void;
  txManager: ReturnType<typeof useTxManager>;
  txPendingDialog: boolean;
  setTxPendingDialog: (open: boolean) => void;
};

export const OrderContext = createContext({} as OrderContextType);

export function OrderProvider({ children }: PropsWithChildren) {
  const { safe } = useSafeAppsSDK();
  const {
    data: orders,
    mutate,
    isLoading,
    isValidating,
    error,
  } = useSWR(
    {
      chainId: safe.chainId as ChainId,
      address: safe.safeAddress as Address,
    },
    getProcessedStopLossOrders,
    {
      fallbackData: [],
    },
  );

  const [txPendingDialog, setTxPendingDialog] = useState(false);

  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  function addDraftOrders(orders: DraftOrder[]): void {
    setDraftOrders([...draftOrders, ...orders]);
  }

  function removeDraftOrders(ids: string[]): void {
    setDraftOrders(draftOrders.filter((order) => !ids.includes(order.id)));
  }

  function changeDraftOrdersStatusToCreating(ids: string[]): void {
    setDraftOrders(
      draftOrders.map((order) => {
        if (ids.includes(order.id)) {
          return {
            ...order,
            status: "creating",
          };
        }
        return order;
      }),
    );
  }

  const txManager = useTxManager();

  useEffect(() => {
    if (!txManager.isPonderUpdating) {
      mutate();
      setDraftOrders(
        draftOrders.filter((order) => order.status !== "creating"),
      );
    }
  }, [txManager.isPonderUpdating]);

  return (
    <OrderContext.Provider
      value={{
        draftOrders,
        setDraftOrders,
        addDraftOrders,
        removeDraftOrders,
        isLoading: isLoading || isValidating,
        error,
        mutate,
        orders,
        txManager,
        txPendingDialog,
        setTxPendingDialog,
        changeDraftOrdersStatusToCreating,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrder() {
  const context = useContext(OrderContext);
  return context;
}
