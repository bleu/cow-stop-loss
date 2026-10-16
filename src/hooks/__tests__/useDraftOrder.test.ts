/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

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
const orderInput: SwapData = {
  tokenSell: sellTokens[1].token,
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
          address?.toLowerCase() ===
          "0xf4030086522a5beea4988f8ca5b36dbc97bee88c"
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
          tokenSell: sellTokens[0].token,
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

  it("prepares rounded quantities and absolute expiry without number conversion", async () => {
    jest.spyOn(Date, "now").mockReturnValue(1700000000000);
    const draft = await useDraftOrder.getState().createDraftOrder(
      {
        ...orderInput,
        tokenSell: sellTokens[0].token,
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
      tokenSellOracle: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      oraclePrice: 60000,
    });
  });

  it("resolves the selected pair again after creating a different draft", async () => {
    await useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress);

    await expect(
      useDraftOrder
        .getState()
        .createDraftOrder(
          { ...orderInput, tokenSell: sellTokens[0].token },
          1,
          safeAddress,
        ),
    ).resolves.toMatchObject({
      tokenSellOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    });
  });

  it("does not produce a draft when a configured feed cannot be read", async () => {
    jest
      .mocked(publicClientsFromIds[1].readContract)
      .mockRejectedValue(new Error("RPC unavailable"));

    await expect(
      useDraftOrder.getState().createDraftOrder(orderInput, 1, safeAddress),
    ).rejects.toThrow(
      "Unable to read configured price feeds. Please try again.",
    );
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
      tokenSellOracle: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      tokenBuyOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      receiver: "0x4444444444444444444444444444444444444444",
      maxHoursSinceOracleUpdates: 2,
      partiallyFillable: true,
    });
  });

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

  it("uses USDC.e as the Gnosis market-price reference", async () => {
    const gnosisTokens = getSupportedTokens(100);
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
          tokenSell: gnosisTokens.sellTokens[0].token,
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
