"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";

import { useSwapContext } from "#/contexts/swapContext";

import { AlertCard } from "./AlertCard";

export function AdvancedSettingsAlert() {
  const { advancedSettings } = useSwapContext();
  const {
    safe: { safeAddress },
  } = useSafeAppsSDK();

  const isAdvancedSettingsChanged =
    advancedSettings?.receiver.toLowerCase() !== safeAddress.toLowerCase() ||
    advancedSettings?.maxHoursSinceOracleUpdates !== 1 ||
    advancedSettings?.tokenBuyOracle ||
    advancedSettings?.tokenBuyOracle ||
    advancedSettings?.partiallyFillable;

  if (!isAdvancedSettingsChanged) return null;

  return (
    <AlertCard style="warning" title="Advanced mode">
      Advanced settings have been modified. Please proceed with caution.
    </AlertCard>
  );
}
