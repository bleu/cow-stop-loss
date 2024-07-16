"use client";

import React, { useEffect } from "react";

import { useSafeApp } from "#/hooks/useSafeApp";
import { cowTokenList } from "#/lib/cowTokenList";
import { ChainId } from "#/lib/publicClients";
import { fetchTokenUsdPrice } from "#/lib/tokenUtils";
import { IToken } from "#/lib/types";

interface ITokenWithChainId extends IToken {
  chainId: ChainId;
}

interface ITokenPriceMapping {
  [tokenAddress: string]: {
    price: number;
    validUntil: number;
  };
}

interface ITokensContext {
  getTokenList: () => IToken[];
  addImportedToken: (token: IToken) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOrFetchTokenPrice: (token?: IToken) => Promise<number | undefined>;
}

export const TokensContext = React.createContext<ITokensContext>(
  {} as ITokensContext,
);

function fetchFromLocalStorage<T>(key: string): T | null {
  if (typeof window === "undefined" || !window.localStorage) return null;
  const item = localStorage.getItem(key) as string;
  if (!item) return null;

  return JSON.parse(item);
}

export const TOKEN_PRICE_CACHE_DURATION = 10_000; // 10 seconds

export const TokensContextProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  if (typeof window === "undefined" || !window.localStorage) return;

  const { chainId } = useSafeApp();

  const [importedTokenList, setImportedTokenList] = React.useState<
    ITokenWithChainId[]
  >([]);
  const [tokenPricesMapping, setTokenPricesMapping] =
    React.useState<ITokenPriceMapping>();

  function getTokenList() {
    return [
      ...(cowTokenList.filter(
        (token) => token.chainId === chainId,
      ) as IToken[]),
      ...importedTokenList,
    ];
  }

  async function getOrFetchTokenPrice(token?: IToken) {
    if (!token) return undefined;
    const currentTimestamp = Date.now();
    const savedPriceInfo = tokenPricesMapping?.[token.address.toLowerCase()];
    if (savedPriceInfo && savedPriceInfo.validUntil > currentTimestamp) {
      return savedPriceInfo.price;
    }

    const tokenPrice = await fetchTokenUsdPrice({
      tokenAddress: token.address,
      tokenDecimals: token.decimals,
      chainId: chainId as ChainId,
    });

    setTokenPricesMapping({
      ...tokenPricesMapping,
      [token.address.toLowerCase()]: {
        price: tokenPrice,
        validUntil: currentTimestamp + TOKEN_PRICE_CACHE_DURATION, // 10 seconds of cache
      },
    });

    return tokenPrice;
  }

  function addImportedToken(token: IToken) {
    const newImportedTokenList = [
      ...importedTokenList,
      { ...token, chainId: chainId as ChainId },
    ];
    setImportedTokenList(newImportedTokenList);
    localStorage.setItem(
      "importedTokens",
      JSON.stringify(newImportedTokenList),
    );
  }

  useEffect(() => {
    const importedTokens =
      fetchFromLocalStorage<ITokenWithChainId[]>("importedTokens");
    setImportedTokenList(
      importedTokens?.filter((token) => token.chainId === chainId) || [],
    );
  }, [chainId]);

  return (
    <TokensContext.Provider
      value={{
        getTokenList,
        addImportedToken,
        getOrFetchTokenPrice,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
};

export const useTokens = () => React.useContext(TokensContext);
