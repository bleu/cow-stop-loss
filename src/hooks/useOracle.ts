import { create } from "zustand";

import { CHAINS_ORACLE_ROUTER_FACTORY, IRoute } from "#/lib/oracleRouter";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

interface OracleState {
  oracleRoute?: IRoute;
  isLoading: boolean;
  updateOracle: (data: {
    tokenSell?: IToken;
    tokenBuy?: IToken;
    chainId: ChainId;
  }) => Promise<void>;
}

export const useOracleStore = create<OracleState>()((set) => ({
  oracleRoute: undefined,
  isLoading: false,
  updateOracle: async (data) => {
    const { tokenSell, tokenBuy, chainId } = data;
    if (!tokenSell || !tokenBuy) return;
    set({ isLoading: true });
    const oracleRouterClass = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    const oracleRouter = new oracleRouterClass({
      chainId,
      tokenBuy,
      tokenSell,
    });
    try {
      const route = await oracleRouter.findRoute();
      set({ oracleRoute: route, isLoading: false });
    } catch {
      set({ oracleRoute: undefined, isLoading: false });
    }
  },
}));
