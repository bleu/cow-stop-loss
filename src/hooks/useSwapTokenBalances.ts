import { create } from "zustand";

interface TokenBalanceState {
  tokenSellBalance?: string;
  tokenBuyBalance?: string;
  setTokenSellBalance: (balance: string) => void;
  setTokenBuyBalance: (balance: string) => void;
}

export const useSwapTokenBalances = create<TokenBalanceState>()((set) => ({
  tokenSellBalance: undefined,
  tokenBuyBalance: undefined,
  setTokenSellBalance: (balance) => set({ tokenSellBalance: balance }),
  setTokenBuyBalance: (balance) => set({ tokenBuyBalance: balance }),
}));
