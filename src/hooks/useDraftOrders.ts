// hooks/useDraftOrders.ts
import { useCallback, useState } from "react";

import { DraftOrder } from "#/lib/types";

export function useDraftOrders() {
  const [draftOrders, setDraftOrders] = useState<DraftOrder[]>([]);

  const addDraftOrder = useCallback((order: DraftOrder) => {
    setDraftOrders((prev) => [...prev, order]);
  }, []);

  const removeDraftOrder = useCallback((id: string) => {
    setDraftOrders((prev) => prev.filter((order) => order.id !== id));
  }, []);

  return { draftOrders, addDraftOrder, removeDraftOrder };
}
