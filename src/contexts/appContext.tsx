// contexts/AppContext.tsx
import React, { createContext, useContext } from "react";

import { useDraftOrders } from "../hooks/useDraftOrders";
import { useSwap } from "../hooks/useSwap";
import { useTokenList } from "../hooks/useTokenList";
import { useTransaction } from "../hooks/useTransaction";
import { useUIState } from "../hooks/useUIState";

const AppContext = createContext<ReturnType<typeof useAppState> | undefined>(
  undefined
);

function useAppState() {
  const draftOrders = useDraftOrders();
  const swap = useSwap();
  const ui = useUIState();
  const transaction = useTransaction();
  const tokenList = useTokenList();

  return { draftOrders, swap, ui, transaction, tokenList };
}

export function AppProvider({ children }: React.PropsWithChildren) {
  const value = useAppState();
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
