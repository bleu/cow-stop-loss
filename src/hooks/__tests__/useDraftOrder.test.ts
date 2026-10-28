/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

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

import { configuredTokenRoute } from "#/lib/oracleRouter";
import { invalidatePlacementReads } from "#/lib/placementReads";
import { publicClientsFromIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "../useAdvancedSettings";
import { useDraftOrder } from "../useDraftOrder";

const safeAddress = "0x1111111111111111111111111111111111111111";
const { sellTokens, buyToken } = getSupportedTokens(1);
const weth = sellTokens.find(({ token }) => token.symbol === "WETH")!;
const cbBtc = sellTokens.find(({ token }) => token.symbol === "cbBTC")!;
const orderInput: SwapData = {
  tokenSell: cbBtc.token,
  tokenBuy: buyToken.token,
  amountSell: "1",
  amountBuy: "54945",
  strikePrice: "55000",
  slippagePercent: "0.1",
  isSellOrder: true,
  validTo: VALID_TO_OPTIONS.DAY,
};

describe("Supported stop loss draft creation", () => {
  beforeEach(() => {
    for (const chainId of [1, 100] as const) {
      invalidatePlacementReads({ account: safeAddress, chainId });
      jest
        .spyOn(publicClientsFromIds[chainId], "getBlockNumber")
        .mockResolvedValue(BigInt(100));
      jest.spyOn(publicClientsFromIds[chainId], "getBlock").mockResolvedValue({
        number: BigInt(100),
        timestamp: BigInt(1),
      } as Awaited<
        ReturnType<(typeof publicClientsFromIds)[typeof chainId]["getBlock"]>
      >);
    }
    useAdvancedSettingsStore
      .getState()
      .setAdvancedSettings(defaultAdvancedSettings);
    useDraftOrder.getState().setCurrentDraftOrder(undefined);
    global.fetch = jest.fn().mockImplementation(async (input) => {
      const url = String(input);
      return {
        ok: true,
        status: 200,
        json: async () =>
          url.includes("/app_data/") ? url.split("/").pop() : { price: 1 },
      };
    });
    jest
      .spyOn(publicClientsFromIds[1], "readContract")
      .mockImplementation(async ({ address, functionName }) => {
        if (functionName === "decimals") return 8;
        const answer =
          address?.toLowerCase() === cbBtc.priceFeed?.toLowerCase()
            ? BigInt("6000000000000")
            : BigInt("100000000");
        return [BigInt(1), answer, BigInt(1), BigInt(1), BigInt(1)];
      });
  });

  afterEach(() => jest.restoreAllMocks());

  it("derives draft amounts from trigger and slippage instead of a stale buy amount", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: weth.token,
          amountSell: "0.123456789012345678",
          amountBuy: "1",
          strikePrice: "2000",
        },
        1,
        safeAddress,
      ),
    ).resolves.toMatchObject({
      amountSell: "0.123456789012345678",
      amountBuy: "246.666665",
      slippagePercent: "0.1",
      limitPrice: "1998",
    });
  });

  it("preserves direct price authority and ignores stale buy amounts and percent", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          strikePrice: "95",
          limitPriceSource: "price",
          limitPrice: "94",
          slippagePercent: "1.052631578947368421",
          amountBuy: "1",
        },
        1,
        safeAddress,
      ),
    ).resolves.toMatchObject({
      amountSell: "1",
      amountBuy: "94",
      limitPriceSource: "price",
      limitPrice: "94",
    });
  });

  it("preserves a 22-decimal direct limit and rounds the buy amount up", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          strikePrice: "95",
          limitPriceSource: "price",
          limitPrice: "94.0000000000000000000001",
        },
        1,
        safeAddress,
      ),
    ).resolves.toMatchObject({
      amountBuy: "94.000001",
      limitPriceSource: "price",
      limitPrice: "94.0000000000000000000001",
    });
  });

  it.each([undefined, "slippage"] as const)(
    "derives the draft limit from slippage for source %j",
    async (limitPriceSource) => {
      const draft = await useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          strikePrice: "95",
          slippagePercent: "2",
          limitPriceSource,
          limitPrice: "94",
        },
        1,
        safeAddress,
      );
      expect(draft).toMatchObject({ amountBuy: "93.1", limitPrice: "93.1" });
      expect(draft.limitPriceSource).toBe(limitPriceSource);
    },
  );

  it.each([undefined, "96", "0"])(
    "rejects direct price %j before reading price feeds",
    async (limitPrice) => {
      await expect(
        useDraftOrder.getState().createDraftOrder(
          {
            ...orderInput,
            strikePrice: "95",
            limitPriceSource: "price",
            limitPrice,
          },
          1,
          safeAddress,
        ),
      ).rejects.toThrow("Limit price");
      expect(publicClientsFromIds[1].readContract).not.toHaveBeenCalled();
    },
  );

  it("prepares rounded quantities and absolute expiry without number conversion", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    const draft = await useDraftOrder.getState().createDraftOrder(
      {
        ...orderInput,
        tokenSell: weth.token,
        amountSell: "0.123456789012345678",
        amountBuy: "1",
        strikePrice: "2000",
      },
      1,
      safeAddress,
    );

    expect(draft).toMatchObject({
      amountSell: "0.123456789012345678",
      amountBuy: "246.666665",
      strikePrice: "2000",
      receiver: safeAddress,
      isSellOrder: true,
      partiallyFillable: false,
      validTo: 1700086400,
      maxHoursSinceOracleUpdates: 24,
    });
  });

  it("uses the current pair's configured feeds without a cached route", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).resolves.toMatchObject({
      ...configuredTokenRoute({ chainId: 1, ...orderInput }),
      oraclePrice: 60000,
    });
  });

  it("resolves the selected pair again after creating a different draft", async () => {
    await useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress);

    await expect(
      useDraftOrder
        .getState()
        .createDraftOrder(
          { ...orderInput, tokenSell: weth.token },
          1,
          safeAddress,
        ),
    ).resolves.toMatchObject({
      ...configuredTokenRoute({
        chainId: 1,
        tokenSell: weth.token,
        tokenBuy: buyToken.token,
      }),
    });
  });

  it("does not produce a draft when a configured feed cannot be read", async () => {
    jest
      .mocked(publicClientsFromIds[1].readContract)
      .mockRejectedValue(new Error("RPC unavailable"));

    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).rejects.toThrow("RPC unavailable");
  });

  it("ignores stored manual oracles while retaining the other advanced settings", async () => {
    const settings = {
      ...defaultAdvancedSettings,
      receiver: "0x4444444444444444444444444444444444444444",
      maxHoursSinceOracleUpdates: 2,
      partiallyFillable: true,
      tokenSellOracle: "0x2222222222222222222222222222222222222222",
      tokenBuyOracle: "0x3333333333333333333333333333333333333333",
    } as const;
    useAdvancedSettingsStore.getState().setAdvancedSettings(settings);

    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).resolves.toMatchObject({
      ...configuredTokenRoute({ chainId: 1, ...orderInput }),
      receiver: "0x4444444444444444444444444444444444444444",
      maxHoursSinceOracleUpdates: 2,
      partiallyFillable: true,
    });
  });

  it.each([1, 2.5])(
    "checks feed freshness against the applied %s-hour limit",
    async (maxHoursSinceOracleUpdates) => {
      useAdvancedSettingsStore.getState().setAdvancedSettings({
        ...defaultAdvancedSettings,
        maxHoursSinceOracleUpdates,
      });
      jest.mocked(publicClientsFromIds[1].getBlock).mockResolvedValue({
        number: BigInt(100),
        timestamp: BigInt(3602),
      } as Awaited<ReturnType<(typeof publicClientsFromIds)[1]["getBlock"]>>);

      const draft = useDraftOrder
        .getState()
        .createDraftOrder(orderInput, 1, safeAddress);
      if (maxHoursSinceOracleUpdates === 1) {
        await expect(draft).rejects.toThrow("Oracle price data is stale.");
      } else {
        await expect(draft).resolves.toMatchObject({
          maxHoursSinceOracleUpdates,
          oraclePrice: 60000,
        });
      }
    },
  );

  it("rejects noncanonical tokens even when draft creation bypasses the form", async () => {
    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: { ...orderInput.tokenSell, decimals: 18 },
        },
        1,
        safeAddress,
      ),
    ).rejects.toThrow("Unsupported sell token on this chain");
  });

  it("uses the catalog USDT token as the fixed Gnosis buy token", async () => {
    const gnosisTokens = getSupportedTokens(100);
    const gnosisWeth = gnosisTokens.sellTokens.find(
      ({ token }) => token.symbol === "WETH",
    )!;
    expect(gnosisTokens.buyToken.token.symbol).toBe("USDT");
    jest
      .spyOn(publicClientsFromIds[100], "readContract")
      .mockImplementation(async ({ address, functionName }) => {
        if (functionName === "decimals") return 8;
        const answer =
          address?.toLowerCase() ===
          "0xa767f745331d267c7751297d982b050c93985627"
            ? BigInt("200000000000")
            : BigInt("100000000");
        return [BigInt(1), answer, BigInt(1), BigInt(1), BigInt(1)];
      });

    await expect(
      useDraftOrder.getState().createDraftOrder(
        {
          ...orderInput,
          tokenSell: gnosisWeth.token,
          tokenBuy: gnosisTokens.buyToken.token,
        },
        100,
        safeAddress,
      ),
    ).resolves.toMatchObject({
      tokenBuyOracle: gnosisTokens.buyToken.priceFeed,
      oraclePrice: 2000,
    });
  });
});
