import { create } from "zustand";

import { AdvancedSwapSettings } from "#/lib/types";

interface AdvancedSettingsState {
  advancedSettings: AdvancedSwapSettings;
  setAdvancedSettings: (settings: AdvancedSwapSettings) => void;
}

export const defaultAdvancedSettings: AdvancedSwapSettings = {
  receiver: "",
  maxHoursSinceOracleUpdates: 6,
  partiallyFillable: false,
};

export function haveSettingsChanged(
  current: Partial<AdvancedSwapSettings>,
  defaults: AdvancedSwapSettings,
): boolean {
  return Object.keys(current).some(
    (key) =>
      current[key as keyof AdvancedSwapSettings] !==
      defaults[key as keyof AdvancedSwapSettings],
  );
}

export const useAdvancedSettingsStore = create<AdvancedSettingsState>()(
  (set) => ({
    advancedSettings: defaultAdvancedSettings,
    setAdvancedSettings: (settings) => set({ advancedSettings: settings }),
  }),
);
