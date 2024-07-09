"use client";

import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import React, { useEffect } from "react";
import useSWR from "swr";

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
  useTokenPrice: (token: IToken) => { data?: number; error: any };
  useTokenPairPrice: (
    tokenSell: IToken,
    tokenBuy: IToken,
  ) => {
    data?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    error: any;
  };
  getOrFetchTokenPrice: (token?: IToken) => Promise<number | undefined>;
  getTokenPairPrice: (
    tokenSell?: IToken,
    tokenBuy?: IToken,
  ) => Promise<number | undefined>;
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

  const {
    safe: { chainId },
  } = useSafeAppsSDK();

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
      return tokenPricesMapping[token.address].price;
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

  async function getTokenPairPrice(tokenSell?: IToken, tokenBuy?: IToken) {
    if (!tokenSell || !tokenBuy) return undefined;
    return Promise.all([
      getOrFetchTokenPrice(tokenSell),
      getOrFetchTokenPrice(tokenBuy),
    ]).then(([sellPrice, buyPrice]) => {
      if (!sellPrice || !buyPrice) return undefined;
      return sellPrice / buyPrice;
    });
  }

  const useTokenPrice = (token: IToken) => {
    return useSWR(token, getOrFetchTokenPrice, {
      refreshInterval: TOKEN_PRICE_CACHE_DURATION,
    });
  };

  const useTokenPairPrice = (tokenSell?: IToken, tokenBuy?: IToken) => {
    return useSWR(
      [tokenSell, tokenBuy],
      ([tokenSell, tokenBuy]) => getTokenPairPrice(tokenSell, tokenBuy),
      {
        refreshInterval: TOKEN_PRICE_CACHE_DURATION,
      },
    );
  };

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
        useTokenPrice,
        useTokenPairPrice,
        getOrFetchTokenPrice,
        getTokenPairPrice,
      }}
    >
      {children}
    </TokensContext.Provider>
  );
};

export const useTokens = () => React.useContext(TokensContext);
