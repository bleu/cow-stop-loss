import { Address } from "viem";
import { create } from "zustand";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { generateSwapSchema, VALID_TO_VALUES_MAP } from "#/lib/schema";
import { fetchPairUsdPrice } from "#/lib/tokenUtils";
import { DraftOrder, OrderStatus, SwapData } from "#/lib/types";
import { generateRandomHex } from "#/utils";

import { useAdvancedSettingsStore } from "./useAdvancedSettings";
import { useDraftOrders } from "./useDraftOrders";

interface DraftOrderState {
  currentDraftOrder?: DraftOrder;
  setCurrentDraftOrder: (order: DraftOrder | undefined) => void;
  createDraftOrder: (
    data: SwapData,
    chainId: ChainId,
    safeAddress: Address,
  ) => Promise<DraftOrder>;
}

export const useDraftOrder = create<DraftOrderState>()((set) => ({
  currentDraftOrder: undefined,
  setCurrentDraftOrder: (order) => set({ currentDraftOrder: order }),
  createDraftOrder: async (data, chainId, safeAddress) => {
    const swapData = generateSwapSchema(chainId).parse(data);
    const { advancedSettings } = useAdvancedSettingsStore.getState();
    const draftOrders = useDraftOrders.getState().draftOrders;

    const receiver =
      advancedSettings.receiver === ""
        ? safeAddress
        : advancedSettings.receiver;

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
      maxHoursSinceOracleUpdates: advancedSettings.maxHoursSinceOracleUpdates,
      partiallyFillable: advancedSettings.partiallyFillable,
      receiver,
      tokenBuyOracle,
      tokenSellOracle,
      id: `draft-${draftOrders.length}-${Date.now()}`,
      oraclePrice,
      fallbackMarketPrice,
      salt,
      validTo,
      status: OrderStatus.DRAFT,
    };

    return draftOrder;
  },
}));
