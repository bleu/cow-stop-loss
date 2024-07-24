import useSWR from "swr";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { getBlockNumberFromPrometheusMetrics } from "#/lib/ponderApi/blockNumber";

import { useSafeApp } from "./useSafeApp";

interface PonderState {
  ponderBlockNumber: number;
}

interface PonderActions {
  setPonderBlockNumber: (ponderBlockNumber: number) => void;
}

const usePonderStore = create<PonderState & PonderActions>()(
  persist(
    (set) => ({
      ponderBlockNumber: 0,
      setPonderBlockNumber: (ponderBlockNumber) => set({ ponderBlockNumber }),
    }),
    {
      name: "ponder-state",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function usePonderState() {
  const setPonderBlockNumber = usePonderStore(
    (state) => state.setPonderBlockNumber,
  );
  const { chainId } = useSafeApp();

  const { mutate, isValidating } = useSWR(
    { chainId },
    getBlockNumberFromPrometheusMetrics,
    {
      onSuccess: (blockNumber) => {
        if (blockNumber) setPonderBlockNumber(blockNumber);
      },
    },
  );

  const ponderBlockNumber = usePonderStore((state) => state.ponderBlockNumber);

  return {
    ponderBlockNumber,
    setPonderBlockNumber,
    isValidating,
    mutate,
  };
}
