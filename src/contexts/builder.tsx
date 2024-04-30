"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React from "react";

import { useRecipeData } from "#/hooks/useRecipeData";
import { cowTokenList } from "#/lib/cowTokenList";
import { IStopLossRecipeData, IToken } from "#/lib/types";

interface IBuilderContext {
  ordersData?: IStopLossRecipeData[];
  getOrderDataByOrderId: (orderId: number) => IStopLossRecipeData | undefined;
  loading: boolean;
  tokenList: IToken[];
  addImportedToken: (token: IToken) => void;
}

export const BuilderContext = React.createContext<IBuilderContext>(
  {} as IBuilderContext
);

export const BuilderContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { ordersData, getOrderDataByOrderId, loading } = useRecipeData();
  const {
    safe: { chainId },
  } = useSafeAppsSDK();
  const [tokenList, setTokenList] = React.useState<IToken[]>(
    cowTokenList.filter((token) => token.chainId === chainId) as IToken[]
  );

  function addImportedToken(token: IToken) {
    setTokenList([...tokenList, token]);
  }

  return (
    <BuilderContext.Provider
      value={{
        ordersData,
        getOrderDataByOrderId,
        loading,
        tokenList,
        addImportedToken,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => React.useContext(BuilderContext);
