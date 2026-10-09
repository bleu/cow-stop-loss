import { calculateAmounts } from "../calculateAmounts";

it("derives the minimum buy amount from the trigger and default slippage", () => {
  expect(
    calculateAmounts({
      isSellOrder: true,
      amount: "1",
      strikePrice: "2000",
      slippagePercent: "0.1",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
  ).toEqual({
    amountSell: "1",
    amountBuy: "1998",
    limitPrice: "1998",
  });
});

it("rounds minimum buy up without losing the exact sell amount", () => {
  expect(
    calculateAmounts({
      isSellOrder: true,
      amount: "0.123456789012345678",
      strikePrice: "2000",
      slippagePercent: "0.1",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
  ).toEqual({
    amountSell: "0.123456789012345678",
    amountBuy: "246.666665",
    limitPrice: "1998",
  });
});

it("rounds maximum sell down while preserving the exact buy amount", () => {
  expect(
    calculateAmounts({
      isSellOrder: false,
      amount: "1",
      strikePrice: "3",
      slippagePercent: "0",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
  ).toEqual({
    amountSell: "0.333333333333333333",
    amountBuy: "1",
    limitPrice: "3",
  });
});

it.each([
  "-0.1",
  "100",
  "100.01",
  "0.001",
  "",
  ".",
  "NaN",
  "Infinity",
  "1e-1",
  " 0.1 ",
])(
  "rejects invalid slippage %j instead of changing the execution limit",
  (slippagePercent) => {
    expect(() =>
      calculateAmounts({
        isSellOrder: true,
        amount: "1",
        strikePrice: "2000",
        slippagePercent,
        sellDecimals: 18,
        buyDecimals: 6,
      }),
    ).toThrow(
      "Slippage must be between 0% and 99.99% with at most two decimal places",
    );
  },
);

it("rejects an exact buy amount with more decimal places than its token", () => {
  expect(() =>
    calculateAmounts({
      isSellOrder: false,
      amount: "1.0000001",
      strikePrice: "2000",
      slippagePercent: "0.1",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
  ).toThrow("Amount must be positive with at most 6 decimal places");
});

it("rejects an exact buy whose maximum sell rounds to zero", () => {
  expect(() =>
    calculateAmounts({
      isSellOrder: false,
      amount: "0.000001",
      strikePrice: "2000",
      slippagePercent: "0.1",
      sellDecimals: 8,
      buyDecimals: 6,
    }),
  ).toThrow("Amount is too small for this token's precision");
});

it.each([
  ["0", "2000"],
  ["0.1", "1998"],
  ["0.5", "1990"],
  ["1", "1980"],
  ["0.25", "1995"],
  ["99.99", "0.2"],
])(
  "accepts %s%% slippage and derives a minimum buy of %s",
  (slippagePercent, amountBuy) => {
    expect(
      calculateAmounts({
        isSellOrder: true,
        amount: "1",
        strikePrice: "2000",
        slippagePercent,
        sellDecimals: 18,
        buyDecimals: 6,
      }).amountBuy,
    ).toBe(amountBuy);
  },
);

it("uses WBTC's eight decimals for the maximum sell amount", () => {
  expect(
    calculateAmounts({
      isSellOrder: false,
      amount: "1",
      strikePrice: "3",
      slippagePercent: "0",
      sellDecimals: 8,
      buyDecimals: 6,
    }).amountSell,
  ).toBe("0.33333333");
});

it("keeps Sepolia USDC's eighteen-decimal minimum buy amount", () => {
  expect(
    calculateAmounts({
      isSellOrder: true,
      amount: "0.000000000000000001",
      strikePrice: "3",
      slippagePercent: "0",
      sellDecimals: 18,
      buyDecimals: 18,
    }).amountBuy,
  ).toBe("0.000000000000000003");
});

it("preserves amounts beyond JavaScript's safe integer precision", () => {
  expect(
    calculateAmounts({
      isSellOrder: true,
      amount: "9007199254740993.000000000000000001",
      strikePrice: "2",
      slippagePercent: "0",
      sellDecimals: 18,
      buyDecimals: 18,
    }).amountBuy,
  ).toBe("18014398509481986.000000000000000002");
});

it.each(["0", "-1", "NaN", "1e3", "0.0000000000000000001"])(
  "rejects a trigger %j that cannot be encoded exactly",
  (strikePrice) => {
    expect(() =>
      calculateAmounts({
        isSellOrder: true,
        amount: "1",
        strikePrice,
        slippagePercent: "0.1",
        sellDecimals: 18,
        buyDecimals: 6,
      }),
    ).toThrow("Trigger price must be positive with at most 18 decimal places");
  },
);
