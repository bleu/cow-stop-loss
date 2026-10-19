import type { Address } from "viem";

import { ChainId, supportedChainIds } from "../publicClients";
import { generateSwapSchema, swapSchema, VALID_TO_OPTIONS } from "../schema";
import { findKnownToken, getSupportedTokens } from "../supportedTokens";
import * as catalog from "../tokenCatalog";

function validOrder(chainId: ChainId) {
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  return {
    tokenSell:
      sellTokens[0]?.token ??
      catalog.TOKEN_CATALOG.find(
        (token) =>
          token.chainId === chainId &&
          token.address.toLowerCase() !== buyToken.token.address.toLowerCase(),
      )!,
    tokenBuy: buyToken.token,
    amountSell: "2",
    amountBuy: "4",
    strikePrice: "3",
    slippagePercent: "1",
    isSellOrder: true,
    validTo: VALID_TO_OPTIONS.DAY,
  };
}

afterEach(() => jest.restoreAllMocks());

describe("fixed USD buy token policy", () => {
  it.each(supportedChainIds.filter((chainId) => chainId !== 11155111))(
    "rejects creation with a fixture unavailable reason on chain %s",
    (chainId) => {
      const unavailableReason =
        "TEST-only: network execution review is incomplete.";
      jest
        .spyOn(catalog, "catalogUnavailableReason")
        .mockReturnValue(unavailableReason);
      const configured = getSupportedTokens(chainId);
      expect(configured.sellTokens).toEqual([]);
      expect(configured.unavailableReason).toBe(unavailableReason);
      expect(swapSchema.safeParse(validOrder(chainId)).success).toBe(true);
      const result = generateSwapSchema(chainId).safeParse(validOrder(chainId));
      expect(result.success).toBe(false);
      if (!result.success)
        expect(result.error.issues.map(({ message }) => message)).toContain(
          unavailableReason,
        );
    },
  );

  it.each(supportedChainIds)(
    "accepts the designated buy token on chain %s",
    (chainId) => {
      expect(
        generateSwapSchema(chainId).safeParse(validOrder(chainId)).success,
      ).toBe(true);
    },
  );

  it("keeps exact-sell amounts and rejects exact-buy mode", () => {
    const parsed = generateSwapSchema(11155111).parse(validOrder(11155111));
    expect(parsed.isSellOrder).toBe(true);
    expect(parsed.amountSell).toBe("2");
    expect(
      generateSwapSchema(11155111).safeParse({
        ...validOrder(11155111),
        isSellOrder: false,
      }).success,
    ).toBe(false);
  });

  it("rejects another buy token even when the base schema accepts it", () => {
    const order = {
      ...validOrder(11155111),
      tokenBuy: {
        address: "0x0000000000000000000000000000000000000002" as Address,
        decimals: 18,
        symbol: "OTHER",
      },
    };
    expect(swapSchema.safeParse(order).success).toBe(true);
    const result = generateSwapSchema(11155111).safeParse(order);
    expect(result.success).toBe(false);
    if (!result.success)
      expect(result.error.issues[0].path).toEqual(["tokenBuy"]);
  });

  it("rejects a buy token left from another chain", () => {
    expect(
      generateSwapSchema(11155111).safeParse(validOrder(100)).success,
    ).toBe(false);
  });

  it("accepts a lowercase token address", () => {
    const order = validOrder(11155111);
    order.tokenBuy = {
      ...order.tokenBuy,
      address: order.tokenBuy.address.toLowerCase() as Address,
    };
    expect(generateSwapSchema(11155111).safeParse(order).success).toBe(true);
  });

  it("rejects a malformed buy address without throwing", () => {
    expect(
      generateSwapSchema(11155111).safeParse({
        ...validOrder(11155111),
        tokenBuy: { ...validOrder(11155111).tokenBuy, address: 42 },
      }).success,
    ).toBe(false);
  });

  it.each(["decimals", "symbol"] as const)(
    "rejects modified buy token %s",
    (field) => {
      const order = validOrder(11155111);
      expect(
        generateSwapSchema(11155111).safeParse({
          ...order,
          tokenBuy: {
            ...order.tokenBuy,
            [field]: field === "decimals" ? 6 : "FORGED",
          },
        }).success,
      ).toBe(false);
    },
  );

  it("rejects selling the designated buy token regardless of address case", () => {
    const order = validOrder(11155111);
    expect(
      generateSwapSchema(11155111).safeParse({
        ...order,
        tokenSell: {
          ...order.tokenBuy,
          address: order.tokenBuy.address.toLowerCase(),
        },
      }).success,
    ).toBe(false);
  });

  it("keeps Gnosis USDT designated while retaining historical USDC.e metadata", () => {
    expect(validOrder(100).tokenBuy.symbol).toBe("USDT");
    const legacy = findKnownToken(
      100,
      "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
    );
    expect(legacy).toMatchObject({ symbol: "USDC.e", decimals: 6 });
    expect(
      generateSwapSchema(100).safeParse({
        ...validOrder(100),
        tokenBuy: legacy,
      }).success,
    ).toBe(false);
  });

  it("retains Ethereum WBTC metadata without allowing new orders", () => {
    const legacy = findKnownToken(
      1,
      "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    );
    expect(legacy).toMatchObject({ symbol: "WBTC", decimals: 8 });
    expect(
      generateSwapSchema(1).safeParse({ ...validOrder(1), tokenSell: legacy })
        .success,
    ).toBe(false);
  });
});
