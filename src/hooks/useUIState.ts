import { create } from "zustand";
import { persist, PersistOptions } from "zustand/middleware";

interface UIState {
  txPendingDialogOpen: boolean;
  firstAccess: boolean;
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
      txPendingDialogOpen: false,
      firstAccess: true,
      setTxPendingDialogOpen: (open) => set({ txPendingDialogOpen: open }),
      setFirstAccess: (value) => set({ firstAccess: value }),
    }),
    persistOptions
  )
);
