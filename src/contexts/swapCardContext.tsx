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
import { generateRandomHex } from "#/utils";

import { useOrder } from "./ordersContext";
import { useTokens } from "./tokensContext";

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
  {} as ISwapContext,
);

const loadAdvancedSettings = (safeAddress: string): AdvancedSwapSettings => {
  const savedSettings = localStorage.getItem("advancedSettings");
  if (savedSettings) {
    return JSON.parse(savedSettings);
  }
  return {
    receiver: safeAddress,
    maxHoursSinceOracleUpdates: 1,
    tokenBuyOracle: "",
    tokenSellOracle: "",
    partiallyFillable: false,
  };
};

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
    localStorage.getItem("firstAccess") === null,
  );
  const { getTokenPairPrice } = useTokens();

  const [oracleRoute, setOracleRoute] = React.useState<IRoute>();
  const [currentDraftOrder, setCurrentDraftOrder] =
    React.useState<DraftOrder>();

  const [advancedSettings, setAdvancedSettings] =
    React.useState<AdvancedSwapSettings>(loadAdvancedSettings(safeAddress));

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

    const fallbackMarketPrice = await getTokenPairPrice(
      data.tokenSell,
      data.tokenBuy,
    );

    const timestamp = Date.now().toString(16);
    const randomPart = generateRandomHex(64 - timestamp.length);
    const salt = `0x${timestamp}${randomPart}` as `0x${string}`;

    const draftOrder: DraftOrder = {
      ...data,
      ...advancedSettings,
      tokenBuyOracle,
      tokenSellOracle,
      id: `draft-${draftOrders.length}-${Date.now()}`,
      oraclePrice,
      fallbackMarketPrice,
      salt,
    };
    return draftOrder;
  }

  useEffect(() => {
    if (!firstAccess) {
      localStorage.setItem("firstAccess", "false");
    }
  }, [firstAccess]);

  const saveAdvancedSettings = (settings: AdvancedSwapSettings) => {
    setAdvancedSettings(settings);
    localStorage.setItem("advancedSettings", JSON.stringify(settings));
  };

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
        setAdvancedSettings: saveAdvancedSettings,
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
