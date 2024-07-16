import { create } from "zustand";
import { persist } from "zustand/middleware";

import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

interface TokenListState {
  importedTokens: (IToken & { chainId: ChainId })[];
  addImportedToken: (token: IToken, chainId: ChainId) => void;
  getTokenList: (chainId: ChainId) => IToken[];
}

export const useTokenListStore = create<TokenListState>()(
  persist(
    (set, get) => ({
      importedTokens: [],
      addImportedToken: (token: IToken, chainId: ChainId) =>
        set((state) => ({
          importedTokens: [...state.importedTokens, { ...token, chainId }],
        })),
      getTokenList: (chainId: ChainId) => {
        const { importedTokens } = get();
        return [
          ...(cowTokenList.filter(
            (token) => token.chainId === chainId,
          ) as IToken[]),
          ...importedTokens.filter((token) => token.chainId === chainId),
        ];
      },
    }),
    {
      name: "token-list-storage",
      partialize: (state) => ({ importedTokens: state.importedTokens }),
    },
  ),
);
export function useTokenList(chainId: ChainId) {
  const addImportedToken = useTokenListStore((state) => state.addImportedToken);
  const tokenList = useTokenListStore((state) => state.getTokenList(chainId));

  return {
    tokenList,
    addImportedToken: (token: IToken) => addImportedToken(token, chainId),
  };
}
