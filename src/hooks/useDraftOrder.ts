import { Address, zeroAddress } from "viem";
import { create } from "zustand";

import { calculateAmounts } from "#/lib/calculateAmounts";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import {
  generateAdvancedSettingsSchema,
  generateSwapSchema,
  VALID_TO_VALUES_MAP,
} from "#/lib/schema";
import { fetchPairUsdPrice } from "#/lib/tokenUtils";
import { DraftOrder, OrderStatus, SwapData } from "#/lib/types";
import { generateRandomHex } from "#/utils";

import { useAdvancedSettingsStore } from "./useAdvancedSettings";

interface DraftOrderState {
  currentDraftOrder?: DraftOrder;
  setCurrentDraftOrder: (order: DraftOrder | undefined) => void;
  createDraftOrder: (
    data: SwapData,
    chainId: ChainId,
    walletAddress: Address,
  ) => Promise<DraftOrder>;
}

export const useDraftOrder = create<DraftOrderState>()((set) => ({
  currentDraftOrder: undefined,
  setCurrentDraftOrder: (order) => set({ currentDraftOrder: order }),
  createDraftOrder: async (data, chainId, walletAddress) => {
    const swapData = generateSwapSchema(chainId).parse(data);
    const amounts = calculateAmounts({
      isSellOrder: swapData.isSellOrder,
      amount: swapData.amountSell,
      strikePrice: swapData.strikePrice,
      slippagePercent: swapData.slippagePercent,
      sellDecimals: swapData.tokenSell.decimals,
      buyDecimals: swapData.tokenBuy.decimals,
    });
    const advancedSettings = await generateAdvancedSettingsSchema(
      chainId,
    ).parseAsync(useAdvancedSettingsStore.getState().advancedSettings);

    const receiver =
      advancedSettings.receiver === ""
        ? walletAddress
        : advancedSettings.receiver;
    if (receiver.toLowerCase() === zeroAddress) {
      throw new Error("Receiver must not be the zero address.");
    }

    const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    const oracleRouter = new oracleRouterClass({
      chainId,
      tokenBuy: swapData.tokenBuy,
      tokenSell: swapData.tokenSell,
    });

    const { tokenBuyOracle, tokenSellOracle } = await oracleRouter.findRoute();

    const oraclePrice = await oracleRouter.calculatePrice({
      tokenBuyOracle,
      tokenSellOracle,
    });

    if (!Number.isFinite(oraclePrice) || oraclePrice <= 0) {
      throw new Error("Required price feeds are unavailable or invalid.");
    }

    const fallbackMarketPrice = await fetchPairUsdPrice({
      sellToken: swapData.tokenSell,
      buyToken: swapData.tokenBuy,
      chainId: chainId as ChainId,
    });

    const timestamp = Date.now();
    const timestampHex = timestamp.toString(16);
    const randomPart = generateRandomHex(64 - timestampHex.length);
    const salt = `0x${timestampHex}${randomPart}` as `0x${string}`;
    const validTo =
      Math.floor(timestamp / 1000) + VALID_TO_VALUES_MAP[swapData.validTo];

    const draftOrder: DraftOrder = {
      ...swapData,
      ...amounts,
      maxHoursSinceOracleUpdates: advancedSettings.maxHoursSinceOracleUpdates,
      partiallyFillable: advancedSettings.partiallyFillable,
      receiver,
      tokenBuyOracle,
      tokenSellOracle,
      id: crypto.randomUUID(),
      oraclePrice,
      fallbackMarketPrice,
      salt,
      validTo,
      status: OrderStatus.DRAFT,
    };

    return draftOrder;
  },
}));
