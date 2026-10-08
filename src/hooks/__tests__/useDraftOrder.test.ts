/** @jest-environment jsdom */

import { publicClientsFromIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "../useAdvancedSettings";
import { useDraftOrder } from "../useDraftOrder";
import { useDraftOrders } from "../useDraftOrders";

const safeAddress = "0x1111111111111111111111111111111111111111";
const { sellTokens, buyToken } = getSupportedTokens(1);
const orderInput: SwapData = {
  tokenSell: sellTokens[1].token,
  tokenBuy: buyToken.token,
  amountSell: 1,
  amountBuy: 50000,
  strikePrice: 55000,
  limitPrice: 50000,
  isSellOrder: true,
  validTo: VALID_TO_OPTIONS.DAY,
};

describe("Supported stop loss draft creation", () => {
  beforeEach(() => {
    useAdvancedSettingsStore
      .getState()
      .setAdvancedSettings(defaultAdvancedSettings);
    useDraftOrder.getState().setCurrentDraftOrder(undefined);
    useDraftOrders.getState().setDraftOrders([]);
    global.fetch = jest.fn().mockResolvedValue({
      json: async () => ({ price: 1 }),
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
    global.fetch = jest.fn().mockImplementation(async (input) => {
      const address = String(input)
        .split("/token/")[1]
        ?.split("/")[0]
        .toLowerCase();
      const prices: Record<string, number> = {
        "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1": 1,
        "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0": 500000000,
      };
      return { json: async () => ({ price: prices[address || ""] }) };
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
    ).resolves.toMatchObject({ fallbackMarketPrice: expect.closeTo(2000, 8) });
  });
});
