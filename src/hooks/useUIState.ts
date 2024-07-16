// hooks/useUIState.ts
import { useCallback, useState } from "react";

export function useUIState() {
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [txPendingDialogOpen, setTxPendingDialogOpen] = useState(false);
  const [firstAccess, setFirstAccess] = useState(
    localStorage.getItem("firstAccess") === null,
  );

  const setFirstAccessCallback = useCallback((value: boolean) => {
    setFirstAccess(value);
    localStorage.setItem("firstAccess", value ? "true" : "false");
  }, []);

  return {
    reviewDialogOpen,
    setReviewDialogOpen,
    txPendingDialogOpen,
    setTxPendingDialogOpen,
    firstAccess,
    setFirstAccess: setFirstAccessCallback,
  };
}
