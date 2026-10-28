// Opt in to simulated TEST approvals; production policy remains unchanged.
jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      TEST_SUPPORTED_TOKENS[chainId] ?? actual.getSupportedTokens(chainId),
  };
});

import { type ChainId } from "../publicClients";
import { generateSwapSchema, VALID_TO_OPTIONS } from "../schema";
import { getSupportedTokens } from "../supportedTokens";

const ethereumSwap = {
  tokenSell: {
    address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    symbol: "WETH",
    decimals: 18,
  },
  tokenBuy: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    symbol: "USDC",
    decimals: 6,
  },
  amountSell: "1",
  amountBuy: "1898.1",
  strikePrice: "1900",
  slippagePercent: "0.1",
  isSellOrder: true,
  validTo: VALID_TO_OPTIONS.DAY,
};

describe("Supported stop loss order input", () => {
  it("accepts a direct price with a derived percent that has more than two decimals", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      strikePrice: "95",
      limitPriceSource: "price",
      limitPrice: "94",
      slippagePercent: "1.052631578947368421",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limitPriceSource).toBe("price");
      expect(result.data.limitPrice).toBe("94");
    }
  });

  it("does not validate a stale display percent in price authority", () => {
    expect(
      generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        limitPriceSource: "price",
        limitPrice: "1898.1",
        slippagePercent: "invalid",
      }).success,
    ).toBe(true);
  });

  it.each([
    undefined,
    "",
    "0",
    "-1",
    "1900.0000000000000000000001",
    "1.00000000000000000000001",
    "NaN",
    "1e3",
  ])(
    "maps invalid price %j to the limit field without clamping it",
    (limitPrice) => {
      const result = generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        limitPriceSource: "price",
        limitPrice,
      });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].path).toEqual(["limitPrice"]);
    },
  );

  it.each([undefined, "slippage"])(
    "maps invalid slippage to its field for source %j",
    (limitPriceSource) => {
      const result = generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        limitPriceSource,
        slippagePercent: "0.001",
        limitPrice: "1898.1",
      });
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues[0].path).toEqual(["slippagePercent"]);
    },
  );

  it("maps an invalid trigger to the trigger field in price authority", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      limitPriceSource: "price",
      limitPrice: "94",
      strikePrice: "0",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual(["strikePrice"]);
  });

  it("maps unknown authority to its field", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      limitPriceSource: "unknown",
    });
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual(["limitPriceSource"]);
  });
  it("rejects exact-buy configuration even when its amounts are valid", () => {
    expect(
      generateSwapSchema(1).safeParse({ ...ethereumSwap, isSellOrder: false })
        .success,
    ).toBe(false);
  });

  it.each(["0", "0.1", "0.5", "1", "0.25", "99.99"])(
    "accepts %s%% slippage in the order configuration",
    (slippagePercent) => {
      expect(
        generateSwapSchema(1).safeParse({ ...ethereumSwap, slippagePercent })
          .success,
      ).toBe(true);
    },
  );

  it.each(["-1", "100", "0.001", "", ".", "1e-1", "NaN", "Infinity"])(
    "rejects %j slippage at the configuration interface",
    (slippagePercent) => {
      expect(
        generateSwapSchema(1).safeParse({ ...ethereumSwap, slippagePercent })
          .success,
      ).toBe(false);
    },
  );

  it.each(["0", "-1", "", "NaN"])(
    "rejects exact sell amount %j",
    (amountSell) => {
      expect(
        generateSwapSchema(1).safeParse({ ...ethereumSwap, amountSell })
          .success,
      ).toBe(false);
    },
  );

  it("rejects an exact buy configuration whose sell amount rounds to zero", () => {
    expect(
      generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        tokenSell: getSupportedTokens(1).sellTokens[1].token,
        isSellOrder: false,
        amountBuy: "0.000001",
        strikePrice: "2000",
      }).success,
    ).toBe(false);
  });

  it("accepts slippage configuration without an independently editable limit", () => {
    const result = generateSwapSchema(1).safeParse(ethereumSwap);

    expect(result.success).toBe(true);
  });

  it("rejects an exact sell amount that cannot be represented by its token", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      amountSell: "0.0000000000000000001",
    });

    expect(result.success).toBe(false);
  });

  it.each([1, 100, 42161, 11155111] as const)(
    "accepts each TEST-approved pair on chain %s",
    (chainId) => {
      const { sellTokens, buyToken } = getSupportedTokens(chainId);
      expect(sellTokens.length).toBeGreaterThan(0);
      for (const { token } of sellTokens) {
        expect(
          generateSwapSchema(chainId).safeParse({
            ...ethereumSwap,
            tokenSell: token,
            tokenBuy: buyToken.token,
          }).success,
        ).toBe(true);
      }
    },
  );

  it("accepts token addresses regardless of letter case", () => {
    expect(
      generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        tokenSell: {
          ...ethereumSwap.tokenSell,
          address: ethereumSwap.tokenSell.address.toLowerCase(),
        },
        tokenBuy: {
          ...ethereumSwap.tokenBuy,
          address: ethereumSwap.tokenBuy.address.toLowerCase(),
        },
      }).success,
    ).toBe(true);
  });

  it("rejects an unsupported sell address even when its symbol is WETH", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      tokenSell: {
        ...ethereumSwap.tokenSell,
        address: "0x1111111111111111111111111111111111111111",
      },
    });

    expect(result.success).toBe(false);
  });

  it("rejects a buy token other than the chain's fixed USD token", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      tokenBuy: {
        address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        symbol: "WBTC",
        decimals: 8,
      },
    });

    expect(result.success).toBe(false);
  });

  it.each<ChainId>([100, 42161, 11155111])(
    "rejects an Ethereum sell token on chain %s",
    (chainId) => {
      expect(
        generateSwapSchema(chainId).safeParse({
          ...ethereumSwap,
          tokenBuy: getSupportedTokens(chainId).buyToken.token,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects a reversed pair", () => {
    expect(
      generateSwapSchema(1).safeParse({
        ...ethereumSwap,
        tokenSell: ethereumSwap.tokenBuy,
        tokenBuy: ethereumSwap.tokenSell,
      }).success,
    ).toBe(false);
  });

  it.each([
    {
      chainId: 100 as const,
      tokenBuy: {
        address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
        symbol: "USDC",
        decimals: 6,
      },
    },
    {
      chainId: 42161 as const,
      tokenBuy: {
        address: "0xFF970A61A04b1cA14834A43f5de4533eBDDB5CC8",
        symbol: "USDC.e",
        decimals: 6,
      },
    },
  ])(
    "rejects the other USDC variant on chain $chainId",
    ({ chainId, tokenBuy }) => {
      expect(
        generateSwapSchema(chainId).safeParse({
          ...ethereumSwap,
          tokenSell: getSupportedTokens(chainId).sellTokens[0].token,
          tokenBuy,
        }).success,
      ).toBe(false);
    },
  );

  it("rejects token metadata that would encode the wrong sell amount", () => {
    const result = generateSwapSchema(1).safeParse({
      ...ethereumSwap,
      tokenSell: { ...ethereumSwap.tokenSell, decimals: 6 },
    });

    expect(result.success).toBe(false);
  });
});
