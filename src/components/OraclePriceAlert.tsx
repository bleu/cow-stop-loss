import { DraftOrder } from "#/lib/types";

import { AlertCard } from "./AlertCard";

export function OraclePriceWarning({ draftOrder }: { draftOrder: DraftOrder }) {
  if (!draftOrder.oraclePrice)
    return (
      <AlertCard style="warning" title="Oracle price not available">
        The oracle price is not available. Please proceed with caution.
      </AlertCard>
    );
  if (!draftOrder.marketPrice)
    return (
      <AlertCard style="warning" title="Oracle price not available">
        The market price is not available. Please proceed with caution.
      </AlertCard>
    );

  const oracleAndMarketPriceDiffAboveThreshold =
    Math.abs(draftOrder.oraclePrice - draftOrder.marketPrice) /
      draftOrder.marketPrice >
    0.1;
  if (oracleAndMarketPriceDiffAboveThreshold) {
    return (
      <AlertCard style="warning" title="Oracle price differs from market price">
        The oracle price differs from the market price by more than 10%. Please
        proceed with caution.
      </AlertCard>
    );
  }
  return null;
}
