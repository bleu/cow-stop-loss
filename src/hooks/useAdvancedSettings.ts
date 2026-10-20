import { create } from "zustand";

import { AdvancedSwapSettings } from "#/lib/types";

type OracleAgeMode = "automatic" | "explicit";

interface AdvancedSettingsState {
  advancedSettings: AdvancedSwapSettings;
  oracleAgeMode: OracleAgeMode;
  setAdvancedSettings: (
    settings: AdvancedSwapSettings,
    oracleAgeMode?: OracleAgeMode,
  ) => void;
  resetAdvancedSettings: () => void;
}

export const defaultAdvancedSettings: AdvancedSwapSettings = {
  receiver: "",
  maxHoursSinceOracleUpdates: 24,
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

export function advancedSettingsForRoute(
  settings: AdvancedSwapSettings,
  oracleAgeMode: OracleAgeMode,
  maxAgeSeconds: number,
): AdvancedSwapSettings {
  return oracleAgeMode === "automatic"
    ? {
        ...settings,
        maxHoursSinceOracleUpdates: Math.min(
          defaultAdvancedSettings.maxHoursSinceOracleUpdates,
          maxAgeSeconds / 3600,
        ),
      }
    : settings;
}

export const useAdvancedSettingsStore = create<AdvancedSettingsState>()(
  (set) => ({
    advancedSettings: defaultAdvancedSettings,
    oracleAgeMode: "automatic",
    setAdvancedSettings: (settings, oracleAgeMode = "explicit") =>
      set({ advancedSettings: settings, oracleAgeMode }),
    resetAdvancedSettings: () =>
      set({
        advancedSettings: defaultAdvancedSettings,
        oracleAgeMode: "automatic",
      }),
  }),
);
