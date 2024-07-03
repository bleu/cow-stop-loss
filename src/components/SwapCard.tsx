"use client";

import { useSwapCardContext } from "#/contexts/swapCardContext";

import { SwapCardIntroduction } from "./SwapCardIntroduction";
import { SwapForm } from "./SwapForm";

export function SwapCard() {
  const { firstAccess } = useSwapCardContext();
  if (firstAccess) {
    return <SwapCardIntroduction />;
  }
  return <SwapForm />;
}
