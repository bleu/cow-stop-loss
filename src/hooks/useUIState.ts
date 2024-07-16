import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

interface UIState {
  reviewDialogOpen: boolean;
  txPendingDialogOpen: boolean;
  firstAccess: boolean;
  setReviewDialogOpen: (open: boolean) => void;
  setTxPendingDialogOpen: (open: boolean) => void;
  setFirstAccess: (value: boolean) => void;
}

type UIStatePersist = Pick<UIState, "firstAccess">;

type UIStatePersistOptions = PersistOptions<UIState, UIStatePersist>;

const persistOptions: UIStatePersistOptions = {
  name: "ui-state-storage",
  partialize: (state) => ({ firstAccess: state.firstAccess }),
};

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      reviewDialogOpen: false,
      txPendingDialogOpen: false,
      firstAccess: true,
      setReviewDialogOpen: (open) => set({ reviewDialogOpen: open }),
      setTxPendingDialogOpen: (open) => set({ txPendingDialogOpen: open }),
      setFirstAccess: (value) => set({ firstAccess: value }),
    }),
    persistOptions,
  ),
);
