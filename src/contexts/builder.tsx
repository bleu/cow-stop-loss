"use client";

import React from "react";

import { useRecipeData } from "#/hooks/useRecipeData";
import { IStopLossRecipeData } from "#/lib/types";

interface IBuilderContext {
  ordersData?: IStopLossRecipeData[];
  getOrderDataByOrderId: (orderId: number) => IStopLossRecipeData | undefined;
  loading: boolean;
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

  return (
    <BuilderContext.Provider
      value={{
        ordersData,
        getOrderDataByOrderId,
        loading,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => React.useContext(BuilderContext);
