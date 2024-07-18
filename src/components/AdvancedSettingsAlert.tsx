"use client";

import {
  defaultAdvancedSettings,
  haveSettingsChanged,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";

import { AlertCard } from "./ui/alert-card";

export function AdvancedSettingsAlert() {
  const advancedSettings = useAdvancedSettingsStore(
    (state) => state.advancedSettings,
  );

  const isAdvancedSettingsChanged = haveSettingsChanged(
    advancedSettings,
    defaultAdvancedSettings,
  );

  if (!isAdvancedSettingsChanged) return null;

  return (
    <AlertCard style="warning" title="Advanced mode">
      Advanced settings have been modified. Please proceed with caution.
    </AlertCard>
  );
}
