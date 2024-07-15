"use client";

import { useSwapCardContext } from "#/contexts/swapCardContext";
import { useSafeApp } from "#/hooks/useSafeApp";

import { AlertCard } from "./ui/alert-card";

export function AdvancedSettingsAlert() {
  const { advancedSettings } = useSwapCardContext();
  const { safeAddress } = useSafeApp();

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
