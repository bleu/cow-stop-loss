"use client";

import { PixelIcon } from "#/components/ui/pixel-icon";
import { useAdvancedSettingsStore } from "#/hooks/useAdvancedSettings";

export function AdvancedSettingsAlert({
  slippagePercent,
}: {
  slippagePercent: string;
}) {
  const advancedSettings = useAdvancedSettingsStore(
    (state) => state.advancedSettings,
  );

  const warnings = [
    advancedSettings.maxHoursSinceOracleUpdates > 24 &&
      "The order accepts oracle prices older than 24 hours.",
    Number(slippagePercent) > 1 && "Price slippage is above 1%.",
  ].filter(Boolean);

  if (!warnings.length) return null;

  return (
    <aside
      role="note"
      className="pixel-inset mt-2 flex items-start gap-2 rounded-none bg-muted/45 px-3 py-2.5 text-xs text-muted-foreground"
    >
      <PixelIcon name="info" className="mt-0.5 size-4 shrink-0 text-primary" />
      <p>{warnings.join(" ")}</p>
    </aside>
  );
}
