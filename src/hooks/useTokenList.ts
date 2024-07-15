import { useEffect, useState } from "react";

import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";
import { IToken } from "#/lib/types";

import { useSafeApp } from "./useSafeApp";

export function useTokenList() {
  const { chainId } = useSafeApp();
  const [importedTokenList, setImportedTokenList] = useState<IToken[]>([]);

  useEffect(() => {
    const storedTokens = localStorage.getItem("importedTokens");
    if (storedTokens) {
      const parsedTokens = JSON.parse(storedTokens) as (IToken & {
        chainId: ChainId;
      })[];
      setImportedTokenList(
        parsedTokens.filter((token) => token.chainId === chainId)
      );
    }
  }, [chainId]);

  const tokenList = [
    ...(cowTokenList.filter((token) => token.chainId === chainId) as IToken[]),
    ...importedTokenList,
  ];

  function addImportedToken(token: IToken) {
    const newImportedTokenList = [
      ...importedTokenList,
      { ...token, chainId: chainId as ChainId },
    ];
    setImportedTokenList(newImportedTokenList);
    localStorage.setItem(
      "importedTokens",
      JSON.stringify(newImportedTokenList)
    );
  }

  return { tokenList, addImportedToken };
}
