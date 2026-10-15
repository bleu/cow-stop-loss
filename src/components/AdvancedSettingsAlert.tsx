"use client";

import { InfoCircledIcon } from "@radix-ui/react-icons";

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
    advancedSettings.partiallyFillable && "Partial execution is enabled.",
    advancedSettings.maxHoursSinceOracleUpdates > 24 &&
      "The order accepts oracle prices older than 24 hours.",
    Number(slippagePercent) > 1 && "Price slippage is above 1%.",
  ].filter(Boolean);

  if (!warnings.length) return null;

  return (
    <aside
      role="note"
      className="mt-2 flex items-start gap-2 rounded-xl bg-muted/45 px-3 py-2.5 text-xs text-muted-foreground"
    >
      <InfoCircledIcon
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-primary"
      />
      <p>{warnings.join(" ")}</p>
    </aside>
  );
}
