import { estimateOrderSlippage } from "../orderSlippage";

it.each([undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
  "uses the fallback for an unavailable pair allowance (%s)",
  (slippageBps) => {
    expect(estimateOrderSlippage({ slippageBps })).toMatchObject({
      requiredBps: 100,
      usedFallback: true,
    });
  },
);

it.each([
  [199, false],
  [200, true],
  [500, true],
])("warns at the 2% boundary (%s bps)", (slippageBps, isHigh) => {
  expect(
    estimateOrderSlippage({ slippageBps: slippageBps as number }),
  ).toMatchObject({ isHigh, isCapped: false });
});

it("does not lower the pair allowance for a favorable quote", () => {
  expect(
    estimateOrderSlippage({
      slippageBps: 50,
      quote: {
        sellAmount: BigInt("1000000000000000000"),
        buyAmount: BigInt("2100000000"),
        sellDecimals: 18,
        buyDecimals: 6,
        oraclePrice: "2000",
      },
    }),
  ).toMatchObject({ requiredBps: 50, appliedBps: 50 });
});

it("rounds a small unfavorable gap up to one basis point", () => {
  expect(
    estimateOrderSlippage({
      slippageBps: 50,
      quote: {
        sellAmount: BigInt("1000000000000000000"),
        buyAmount: BigInt("1999999999"),
        sellDecimals: 18,
        buyDecimals: 6,
        oraclePrice: "2000",
      },
    }),
  ).toMatchObject({ requiredBps: 51 });
});

it("adds the fee-inclusive quote gap to the pair allowance", () => {
  expect(
    estimateOrderSlippage({
      slippageBps: 50,
      quote: {
        sellAmount: BigInt("1000000000000000000"),
        buyAmount: BigInt("1960000000"),
        sellDecimals: 18,
        buyDecimals: 6,
        oraclePrice: "2000",
      },
    }),
  ).toEqual({
    requiredBps: 250,
    appliedBps: 250,
    isHigh: true,
    isCapped: false,
    usedFallback: false,
  });
});

it("caps Auto at 5% while keeping the estimated requirement", () => {
  expect(estimateOrderSlippage({ slippageBps: 650 })).toMatchObject({
    requiredBps: 650,
    appliedBps: 500,
    isHigh: true,
    isCapped: true,
  });
});

it("uses 1% when the pair has no slippage recommendation", () => {
  expect(estimateOrderSlippage({})).toEqual({
    requiredBps: 100,
    appliedBps: 100,
    isHigh: false,
    isCapped: false,
    usedFallback: true,
  });
});
