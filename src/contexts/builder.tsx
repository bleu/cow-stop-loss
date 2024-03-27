"use client";

import React, { useState } from "react";

interface IBuilderContext {
  panelClickEvent: boolean;
  emitPanelClickEvent: () => void;
}

export const BuilderContext = React.createContext<IBuilderContext>(
  {} as IBuilderContext
);

export const BuilderContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [panelClickEvent, setPanelClickEvent] = useState<boolean>(false);

  const emitPanelClickEvent = () => {
    setPanelClickEvent(true);
  };

  const contextValue: IBuilderContext = {
    panelClickEvent,
    emitPanelClickEvent,
  };

  return (
    <BuilderContext.Provider value={contextValue}>
      {children}
    </BuilderContext.Provider>
  );
};

export const useBuilder = () => React.useContext(BuilderContext);
