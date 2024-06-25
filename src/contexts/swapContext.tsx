"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";

import { CHAINS_ORACLE_ROUTER_FACTORY } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import {
  AdvancedSwapSettings,
  DraftOrder,
  IToken,
  SwapData,
} from "#/lib/types";

interface ISwapContext {
  advancedSettings?: AdvancedSwapSettings;
  draftOrders: DraftOrder[];
  createDraftOrder: (data: SwapData) => Promise<DraftOrder>;
  addDraftOrders: (data: DraftOrder[]) => void;
  removeDraftOrders: (id: string[]) => void;
  setAdvancedSettings: (data: AdvancedSwapSettings) => void;
}

export const SwapContext = React.createContext<ISwapContext>(
  {} as ISwapContext
);

export const SwapContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();

  const [draftOrders, setDraftOrders] = React.useState<DraftOrder[]>([]);

  const [advancedSettings, setAdvancedSettings] =
    React.useState<AdvancedSwapSettings>({
      receiver: safeAddress,
      maxHoursSinceOracleUpdates: 1,
      tokenBuyOracle: "",
      tokenSellOracle: "",
      partiallyFillable: false,
    });

  const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId];

  async function createDraftOrder(data: SwapData) {
    const draftOrder: DraftOrder = {
      ...data,
      ...advancedSettings,
      id: `draft-${draftOrders.length}-${Date.now()}`,
    };
    if (!advancedSettings.tokenBuyOracle || !advancedSettings.tokenSellOracle) {
      const oracleRouter = new oracleRouterClass({
        chainId: chainId as ChainId,
        tokenBuy: data.tokenBuy as IToken,
        tokenSell: data.tokenSell as IToken,
      });
      const { tokenBuyOracle, tokenSellOracle } =
        await oracleRouter.findRoute();
      draftOrder.tokenBuyOracle = tokenBuyOracle;
      draftOrder.tokenSellOracle = tokenSellOracle;
    }
    return draftOrder;
  }

  function removeDraftOrders(ids: string[]) {
    setDraftOrders(draftOrders.filter((order) => !ids.includes(order.id)));
  }

  function addDraftOrders(orders: DraftOrder[]): void {
    setDraftOrders([...draftOrders, ...orders]);
  }

  return (
    <SwapContext.Provider
      value={{
        draftOrders,
        addDraftOrders,
        removeDraftOrders,
        createDraftOrder,
        advancedSettings,
        setAdvancedSettings,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => React.useContext(SwapContext);
