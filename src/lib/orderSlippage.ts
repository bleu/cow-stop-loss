import { parseUnits } from "viem";

export const DEFAULT_SLIPPAGE_PERCENT = "10";

interface SlippageInput {
  slippageBps?: number;
  quote?: {
    sellAmount: bigint;
    buyAmount: bigint;
    sellDecimals: number;
    buyDecimals: number;
    oraclePrice: string;
  };
}

// Disabled for order creation, which uses DEFAULT_SLIPPAGE_PERCENT.
export function estimateOrderSlippage({ slippageBps, quote }: SlippageInput) {
  const usedFallback =
    !slippageBps || !Number.isFinite(slippageBps) || slippageBps < 0;
  const allowance = usedFallback ? 100 : Math.ceil(slippageBps!);
  let gapBps = 0;
  if (quote) {
    const expected =
      quote.sellAmount *
      parseUnits(quote.oraclePrice, 18) *
      BigInt(10) ** BigInt(quote.buyDecimals);
    const received =
      quote.buyAmount * BigInt(10) ** BigInt(quote.sellDecimals + 18);
    if (expected > received && expected > BigInt(0)) {
      gapBps = Number(
        ((expected - received) * BigInt(10000) + expected - BigInt(1)) /
          expected,
      );
    }
  }
  const requiredBps = allowance + gapBps;
  return {
    requiredBps,
    appliedBps: Math.min(requiredBps, 1000),
    isHigh: requiredBps >= 200,
    isCapped: requiredBps > 1000,
    usedFallback,
  };
}
