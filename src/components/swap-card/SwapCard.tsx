"use client";

import { useUIStore } from "#/hooks/useUIState";

import { SwapCardIntroduction } from "./SwapCardIntroduction";
import { SwapForm } from "./SwapForm";

export function SwapCard() {
  const firstAccess = useUIStore((state) => state.firstAccess);
  if (firstAccess) {
    return <SwapCardIntroduction />;
  }
  return <SwapForm />;
}
