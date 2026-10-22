"use client";

import { WarningNotice } from "#/components/ui/warning-notice";
import { useAdvancedSettingsStore } from "#/hooks/useAdvancedSettings";

export function AdvancedSettingsAlert({
  slippagePercent,
  showSlippageWarning = true,
}: {
  slippagePercent: string;
  showSlippageWarning?: boolean;
}) {
  const advancedSettings = useAdvancedSettingsStore(
    (state) => state.advancedSettings,
  );

  const warnings = [
    advancedSettings.maxHoursSinceOracleUpdates > 24 &&
      "The order accepts oracle prices older than 24 hours.",
    showSlippageWarning &&
      Number(slippagePercent) > 1 &&
      "Price slippage is above 1%.",
  ].filter(Boolean);

  if (!warnings.length) return null;

  return <WarningNotice role="note">{warnings.join(" ")}</WarningNotice>;
}
