import { DraftOrder } from "#/lib/types";

import { AlertCard } from "./AlertCard";

const ORACLE_PRICE_DIFF_THRESHOLD = 0.02;

export function OraclePriceWarning({
  draftOrder,
  marketPrice,
}: {
  draftOrder: DraftOrder;
  marketPrice?: number;
}) {
  if (!draftOrder.oraclePrice)
    return (
      <AlertCard style="warning" title="Oracle price not available">
        The oracle price is not available. Please proceed with caution.
      </AlertCard>
    );
  if (!marketPrice)
    return (
      <AlertCard style="warning" title="Market price not available">
        The market price is not available. Please proceed with caution.
      </AlertCard>
    );

  const oracleAndMarketPriceDiffAboveThreshold =
    Math.abs(draftOrder.oraclePrice - marketPrice) / marketPrice >
    ORACLE_PRICE_DIFF_THRESHOLD;
  if (oracleAndMarketPriceDiffAboveThreshold) {
    return (
      <AlertCard style="warning" title="Oracle price differs from market price">
        The oracle price differs from the market price by more than 2%. Please
        proceed with caution.
      </AlertCard>
    );
  }
  return null;
}
