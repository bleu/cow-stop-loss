import { Address } from "viem";
import { create } from "zustand";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { fetchPairUsdPrice } from "#/lib/tokenUtils";
import { DraftOrder, SwapData } from "#/lib/types";
import { generateRandomHex } from "#/utils";

import { useAdvancedSettingsStore } from "./useAdvancedSettings";
import { useDraftOrders } from "./useDraftOrders";
import { useOracleStore } from "./useOracle";

interface DraftOrderState {
  currentDraftOrder?: DraftOrder;
  setCurrentDraftOrder: (order: DraftOrder | undefined) => void;
  createDraftOrder: (
    data: SwapData,
    chainId: ChainId,
    safeAddress: Address
  ) => Promise<DraftOrder>;
}

export const useDraftOrder = create<DraftOrderState>()((set) => ({
  currentDraftOrder: undefined,
  setCurrentDraftOrder: (order) => set({ currentDraftOrder: order }),
  createDraftOrder: async (data, chainId, safeAddress) => {
    const { advancedSettings } = useAdvancedSettingsStore.getState();
    const { oracleRoute } = useOracleStore.getState();
    const { draftOrders } = useDraftOrders();

    const receiver =
      advancedSettings.receiver === ""
        ? safeAddress
        : advancedSettings.receiver;

    let tokenBuyOracle = advancedSettings.tokenBuyOracle;
    let tokenSellOracle = advancedSettings.tokenSellOracle;
    if (!tokenBuyOracle || !tokenSellOracle) {
      if (!oracleRoute) throw new Error("No route found");
      tokenBuyOracle = oracleRoute.tokenBuyOracle;
      tokenSellOracle = oracleRoute.tokenSellOracle;
    }
    if (!tokenBuyOracle || !tokenSellOracle)
      throw new Error("Oracle not found");

    const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId];
    const oracleRouter = new oracleRouterClass({
      chainId: chainId as ChainId,
      tokenBuy: data.tokenBuy,
      tokenSell: data.tokenSell,
    });

    const oraclePrice = await oracleRouter.calculatePrice({
      tokenBuyOracle,
      tokenSellOracle,
    });

    const fallbackMarketPrice = await fetchPairUsdPrice({
      sellToken: data.tokenSell,
      buyToken: data.tokenBuy,
      chainId: chainId as ChainId,
    });

    const timestamp = Date.now().toString(16);
    const randomPart = generateRandomHex(64 - timestamp.length);
    const salt = `0x${timestamp}${randomPart}` as `0x${string}`;

    const draftOrder: DraftOrder = {
      ...data,
      ...advancedSettings,
      receiver,
      tokenBuyOracle,
      tokenSellOracle,
      id: `draft-${draftOrders.length}-${Date.now()}`,
      oraclePrice,
      fallbackMarketPrice,
      salt,
      status: "draft",
    };

    return draftOrder;
  },
}));
