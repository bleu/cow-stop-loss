import type { ChainId } from "../publicClients";
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
  amountSell: 1,
  amountBuy: 1800,
  strikePrice: 1900,
  limitPrice: 1800,
  isSellOrder: true,
  validTo: VALID_TO_OPTIONS.DAY,
};

describe("Supported stop loss order input", () => {
  it.each([
    { chainId: 1 as const, sell: ["WETH", "WBTC"], buy: "USDC" },
    { chainId: 100 as const, sell: ["WETH", "WBTC"], buy: "USDC.e" },
    { chainId: 42161 as const, sell: ["WETH", "WBTC"], buy: "USDC" },
    { chainId: 11155111 as const, sell: ["WETH"], buy: "USDC (test)" },
  ])(
    "offers only the agreed token choices on chain $chainId",
    ({ chainId, sell, buy }) => {
      const { sellTokens, buyToken } = getSupportedTokens(chainId);
      expect(sellTokens.map(({ token }) => token.symbol)).toEqual(sell);
      expect(buyToken.token.symbol).toBe(buy);
    },
  );

  it.each<ChainId>([1, 100, 42161, 11155111])(
    "accepts each configured pair on chain %s",
    (chainId) => {
      const { sellTokens, buyToken } = getSupportedTokens(chainId);
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

  it("rejects a buy token other than the chain's fixed USDC", () => {
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
