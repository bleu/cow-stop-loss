import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AdvancedSwapSettings } from "#/lib/types";

interface AdvancedSettingsState {
  advancedSettings: AdvancedSwapSettings;
  setAdvancedSettings: (settings: AdvancedSwapSettings) => void;
}

export const defaultAdvancedSettings: AdvancedSwapSettings = {
  receiver: "",
  maxHoursSinceOracleUpdates: 1,
  tokenBuyOracle: "",
  tokenSellOracle: "",
  partiallyFillable: false,
};

export function haveSettingsChanged(
  current: Partial<AdvancedSwapSettings>,
  defaults: AdvancedSwapSettings
): boolean {
  return Object.keys(current).some(
    (key) =>
      current[key as keyof AdvancedSwapSettings] !==
      defaults[key as keyof AdvancedSwapSettings]
  );
}

export const useAdvancedSettingsStore = create<AdvancedSettingsState>()(
  persist(
    (set) => ({
      advancedSettings: defaultAdvancedSettings,
      setAdvancedSettings: (settings) => set({ advancedSettings: settings }),
    }),
    {
      name: "advanced-settings-storage",
      partialize: (state) => ({ advancedSettings: state.advancedSettings }),
    }
  )
);
