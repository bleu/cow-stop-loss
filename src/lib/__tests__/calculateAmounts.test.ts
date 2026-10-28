import {
  calculateAmounts,
  calculateLimitPrice,
  calculateSlippagePercent,
  getOrderAmounts,
} from "../calculateAmounts";
import type { LimitPriceSource, SwapData } from "../types";

const priceInput = {
  isSellOrder: true,
  amount: "1",
  strikePrice: "95",
  slippagePercent: "1.05",
  limitPriceSource: "price" as const,
  limitPrice: "94",
  sellDecimals: 18,
  buyDecimals: 6,
};

const savedOrder: Omit<SwapData, "validTo"> = {
  tokenSell: {
    address: "0x1111111111111111111111111111111111111111",
    symbol: "SELL",
    decimals: 18,
  },
  tokenBuy: {
    address: "0x2222222222222222222222222222222222222222",
    symbol: "BUY",
    decimals: 6,
  },
  isSellOrder: true,
  amountSell: "1",
  amountBuy: "94",
  strikePrice: "95",
  slippagePercent: "1.052631578947368421",
  limitPriceSource: "price",
  limitPrice: "94",
};

describe("Direct limit price", () => {
  it("preserves a price whose derived slippage is not a whole basis point", () => {
    expect(calculateAmounts(priceInput)).toEqual({
      amountSell: "1",
      amountBuy: "94",
      limitPrice: "94",
    });
    expect(calculateSlippagePercent("95", "94")).toBe("1.052631578947368421");
  });

  it("derives prices and percent without a sell amount", () => {
    expect(
      calculateLimitPrice({
        strikePrice: "95",
        slippagePercent: "2",
      }),
    ).toBe("93.1");
    expect(
      calculateLimitPrice({
        strikePrice: "95",
        slippagePercent: "invalid",
        limitPriceSource: "price",
        limitPrice: "93.1",
      }),
    ).toBe("93.1");
    expect(calculateSlippagePercent("95", "93.1")).toBe("2");
    expect(calculateSlippagePercent("95", "95")).toBe("0");
  });

  it("preserves all 22 price decimals and rounds buy atoms up", () => {
    expect(
      calculateAmounts({
        ...priceInput,
        limitPrice: "94.0000000000000000000001",
        buyDecimals: 18,
      }),
    ).toEqual({
      amountSell: "1",
      amountBuy: "94.000000000000000001",
      limitPrice: "94.0000000000000000000001",
    });
    expect(
      calculateAmounts({
        ...priceInput,
        amount: "0.000000000000000001",
        limitPrice: "0.0000000000000000000001",
      }).amountBuy,
    ).toBe("0.000001");
  });

  it.each([
    undefined,
    "",
    "0",
    "-1",
    "96",
    "NaN",
    "Infinity",
    "1e1",
    " 94 ",
    "94.00000000000000000000001",
  ])("rejects invalid direct price %j without changing it", (limitPrice) => {
    expect(() => calculateAmounts({ ...priceInput, limitPrice })).toThrow(
      "Limit price",
    );
  });

  it("accepts a direct limit equal to an 18-decimal trigger", () => {
    expect(
      calculateAmounts({
        ...priceInput,
        strikePrice: "95.000000000000000001",
        limitPrice: "95.000000000000000001",
      }).limitPrice,
    ).toBe("95.000000000000000001");
  });

  it("rejects trigger precision above 18 decimals in price authority", () => {
    expect(() =>
      calculateAmounts({
        ...priceInput,
        strikePrice: "95.0000000000000000001",
      }),
    ).toThrow("Trigger price");
  });

  it("ignores the display percent when price is authoritative", () => {
    expect(
      calculateAmounts({ ...priceInput, slippagePercent: "invalid" })
        .limitPrice,
    ).toBe("94");
  });

  it.each(["unknown", "", null])("rejects unknown source %j", (source) => {
    expect(() =>
      calculateAmounts({
        ...priceInput,
        limitPriceSource: source as LimitPriceSource,
      }),
    ).toThrow("Limit price source");
  });

  it.each([undefined, "slippage"] as const)(
    "keeps legacy slippage authority for source %j",
    (limitPriceSource) => {
      expect(
        calculateAmounts({
          ...priceInput,
          slippagePercent: "2",
          limitPriceSource,
          limitPrice: "94",
        }).limitPrice,
      ).toBe("93.1");
    },
  );
});

describe("Saved amount validation", () => {
  it("recomputes from the direct price without a basis-point round trip", () => {
    expect(getOrderAmounts(savedOrder)).toEqual({
      sellAtoms: BigInt("1000000000000000000"),
      buyAtoms: BigInt("94000000"),
    });
  });

  it("rejects stale buy atoms in price authority", () => {
    expect(() =>
      getOrderAmounts({ ...savedOrder, amountBuy: "94.0025" }),
    ).toThrow("Draft amounts");
  });

  it("rejects missing direct prices", () => {
    expect(() =>
      getOrderAmounts({ ...savedOrder, limitPrice: undefined }),
    ).toThrow("Limit price");
  });

  it("rejects unknown saved authority", () => {
    expect(() =>
      getOrderAmounts({
        ...savedOrder,
        limitPriceSource: "other" as LimitPriceSource,
      }),
    ).toThrow("Limit price source");
  });

  it.each([undefined, "slippage"] as const)(
    "validates a saved limit with source %j even when rounded atoms match",
    (limitPriceSource) => {
      const data = {
        ...savedOrder,
        limitPriceSource,
        slippagePercent: "2",
        amountBuy: "93.1",
        limitPrice: "93.0999999999999999999999",
      };
      expect(() => getOrderAmounts(data)).toThrow("Saved limit price");
      expect(getOrderAmounts({ ...data, limitPrice: "93.1000" }).buyAtoms).toBe(
        BigInt("93100000"),
      );
      expect(getOrderAmounts({ ...data, limitPrice: undefined }).buyAtoms).toBe(
        BigInt("93100000"),
      );
    },
  );
});

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

it("rejects exact-buy amounts instead of deriving a maximum sell amount", () => {
  expect(() =>
    calculateAmounts({
      isSellOrder: false,
      amount: "1",
      strikePrice: "3",
      slippagePercent: "0",
      sellDecimals: 18,
      buyDecimals: 6,
    }),
  ).toThrow("Only exact-sell orders are supported.");
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

it("rejects a sell amount with more decimal places than its token", () => {
  expect(() =>
    calculateAmounts({
      isSellOrder: true,
      amount: "1.000000001",
      strikePrice: "2000",
      slippagePercent: "0.1",
      sellDecimals: 8,
      buyDecimals: 6,
    }),
  ).toThrow(new Error("Amount must be positive"));
});

it.each([0, 6, 8, 18])(
  "uses the short amount error for zero with %i token decimals",
  (sellDecimals) => {
    expect(() =>
      calculateAmounts({ ...priceInput, amount: "0", sellDecimals }),
    ).toThrow(new Error("Amount must be positive"));
  },
);

it.each([0, 6, 18])(
  "rejects excess precision with the short amount error for %i token decimals",
  (sellDecimals) => {
    const amount = `1.${"0".repeat(sellDecimals)}1`;
    expect(() =>
      calculateAmounts({ ...priceInput, amount, sellDecimals }),
    ).toThrow(new Error("Amount must be positive"));
  },
);

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

it("preserves WBTC's eight-decimal exact sell amount", () => {
  expect(
    calculateAmounts({
      isSellOrder: true,
      amount: "0.33333333",
      strikePrice: "3",
      slippagePercent: "0",
      sellDecimals: 8,
      buyDecimals: 6,
    }),
  ).toMatchObject({ amountSell: "0.33333333", amountBuy: "1" });
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
