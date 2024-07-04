"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useEffect } from "react";
import { Address } from "viem";

import { CHAINS_ORACLE_ROUTER_FACTORY, IRoute } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import {
  AdvancedSwapSettings,
  DraftOrder,
  IToken,
  SwapData,
} from "#/lib/types";

import { useOrder } from "./ordersContext";

interface ISwapContext {
  currentDraftOrder?: DraftOrder;
  advancedSettings: AdvancedSwapSettings;
  createDraftOrder: (data: SwapData) => Promise<DraftOrder>;
  reviewDialogOpen: boolean;
  setReviewDialogOpen: (open: boolean) => void;
  setAdvancedSettings: (data: AdvancedSwapSettings) => void;
  setCurrentDraftOrder: (data: DraftOrder) => void;
  updateOracle: (data: {
    tokenSell?: IToken;
    tokenBuy?: IToken;
  }) => Promise<void>;
  tokenSellOracle?: Address;
  tokenBuyOracle?: Address;
  isLoading: boolean;
  firstAccess: boolean;
  setFirstAccess: (data: boolean) => void;
}

export const SwapCardContext = React.createContext<ISwapContext>(
  {} as ISwapContext
);

export const SwapCardContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const {
    safe: { safeAddress, chainId },
  } = useSafeAppsSDK();
  const { draftOrders } = useOrder();
  const [reviewDialogOpen, setReviewDialogOpen] = React.useState(false);
  const [firstAccess, setFirstAccess] = React.useState(
    localStorage.getItem("firstAccess") === null
  );

  const [oracleRoute, setOracleRoute] = React.useState<IRoute>();
  const [currentDraftOrder, setCurrentDraftOrder] =
    React.useState<DraftOrder>();

  const [advancedSettings, setAdvancedSettings] =
    React.useState<AdvancedSwapSettings>({
      receiver: safeAddress,
      maxHoursSinceOracleUpdates: 1,
      tokenBuyOracle: "",
      tokenSellOracle: "",
      partiallyFillable: false,
    });

  const [isLoading, setIsLoading] = React.useState(false);

  const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId as ChainId];

  async function updateOracle({
    tokenSell,
    tokenBuy,
  }: {
    tokenSell?: IToken;
    tokenBuy?: IToken;
  }) {
    if (!tokenSell || !tokenBuy) return;
    setIsLoading(true);
    const oracleRouter = new oracleRouterClass({
      chainId: chainId as ChainId,
      tokenBuy: tokenBuy,
      tokenSell: tokenSell,
    });
    try {
      const route = await oracleRouter.findRoute();
      setOracleRoute(route);
    } catch {
      setOracleRoute(undefined);
    }
    setIsLoading(false);
  }

  async function createDraftOrder(data: SwapData) {
    let tokenBuyOracle = advancedSettings.tokenBuyOracle;
    let tokenSellOracle = advancedSettings.tokenSellOracle;
    if (!advancedSettings.tokenBuyOracle || !advancedSettings.tokenSellOracle) {
      if (!oracleRoute) {
        throw new Error("No route found");
      }
      tokenBuyOracle = oracleRoute.tokenBuyOracle;
      tokenSellOracle = oracleRoute.tokenSellOracle;
    }
    if (!tokenBuyOracle || !tokenSellOracle) {
      throw new Error("Oracle not found");
    }
    const oracleRouter = new oracleRouterClass({
      chainId: chainId as ChainId,
      tokenBuy: data.tokenBuy,
      tokenSell: data.tokenSell,
    });

    const oraclePrice = await oracleRouter.calculatePrice({
      tokenBuyOracle,
      tokenSellOracle,
    });

    const draftOrder: DraftOrder = {
      ...data,
      ...advancedSettings,
      tokenBuyOracle,
      tokenSellOracle,
      id: `draft-${draftOrders.length}-${Date.now()}`,
      oraclePrice,
    };
    return draftOrder;
  }

  useEffect(() => {
    if (!firstAccess) {
      localStorage.setItem("firstAccess", "false");
    }
  }, [firstAccess]);

  return (
    <SwapCardContext.Provider
      value={{
        isLoading,
        reviewDialogOpen,
        setReviewDialogOpen,
        currentDraftOrder,
        setCurrentDraftOrder,
        createDraftOrder,
        advancedSettings,
        setAdvancedSettings,
        updateOracle,
        tokenSellOracle: oracleRoute?.tokenSellOracle,
        tokenBuyOracle: oracleRoute?.tokenBuyOracle,
        firstAccess,
        setFirstAccess,
      }}
    >
      {children}
    </SwapCardContext.Provider>
  );
};

export const useSwapCardContext = () => React.useContext(SwapCardContext);
