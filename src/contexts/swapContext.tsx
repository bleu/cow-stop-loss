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
  addDraftOrder: (data: SwapData) => Promise<void>;
  removeDraftOrder: (index: number) => void;
  setAdvancedSettings: (data: AdvancedSwapSettings) => void;
  reviewOrdersDialogOpen: boolean;
  setReviewOrdersDialogOpen: (open: boolean) => void;
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

  const [reviewOrdersDialogOpen, setReviewOrdersDialogOpen] =
    React.useState(false);

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

  async function addDraftOrder(data: SwapData) {
    const draftOrder: DraftOrder = {
      ...data,
      ...advancedSettings,
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
    setDraftOrders([...draftOrders, draftOrder]);
  }

  function removeDraftOrder(index: number) {
    const newDraftOrders = [...draftOrders];
    newDraftOrders.splice(index, 1);
    setDraftOrders(newDraftOrders);
  }

  return (
    <SwapContext.Provider
      value={{
        draftOrders,
        addDraftOrder,
        removeDraftOrder,
        advancedSettings,
        setAdvancedSettings,
        reviewOrdersDialogOpen,
        setReviewOrdersDialogOpen,
      }}
    >
      {children}
    </SwapContext.Provider>
  );
};

export const useSwapContext = () => React.useContext(SwapContext);
