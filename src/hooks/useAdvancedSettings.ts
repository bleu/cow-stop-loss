import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AdvancedSwapSettings } from "#/lib/types";

interface AdvancedSettingsState {
  advancedSettings: AdvancedSwapSettings;
  setAdvancedSettings: (settings: AdvancedSwapSettings) => void;
}

const defaultAdvancedSettings: AdvancedSwapSettings = {
  receiver: "",
  maxHoursSinceOracleUpdates: 1,
  tokenBuyOracle: "",
  tokenSellOracle: "",
  partiallyFillable: false,
};

export const useAdvancedSettingsStore = create<AdvancedSettingsState>()(
  persist(
    (set) => ({
      advancedSettings: defaultAdvancedSettings,
      setAdvancedSettings: (settings) => set({ advancedSettings: settings }),
    }),
    {
      name: "advanced-settings-storage",
      partialize: (state) => ({ advancedSettings: state.advancedSettings }),
    },
  ),
);
