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
  orders: StopLossOrderType[];
  openOrders: StopLossOrderType[];
  historyOrders: StopLossOrderType[];
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
    }
  );

  const [txPendingDialog, setTxPendingDialog] = useState(false);

  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  function addDraftOrders(orders: DraftOrder[]): void {
    setDraftOrders([...draftOrders, ...orders]);
  }

  function removeDraftOrders(ids: string[]): void {
    setDraftOrders(draftOrders.filter((order) => !ids.includes(order.id)));
  }

  const txManager = useTxManager();

  useEffect(() => {
    if (!txManager.isPonderUpdating) {
      mutate();
    }
  }, [txManager.isPonderUpdating]);

  const historyOrders = orders.filter(
    (order) => !order.singleOrder || order.status === "fulfilled"
  );
  const openOrders = orders.filter(
    (order) => order.singleOrder && order.status !== "fulfilled"
  );

  return (
    <OrderContext.Provider
      value={{
        historyOrders,
        openOrders,
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
