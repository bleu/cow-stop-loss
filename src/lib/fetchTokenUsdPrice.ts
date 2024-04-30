import { Address } from "viem";
import { ChainId } from "./publicClients";
import { IToken } from "./types";
import { gnosis, mainnet, sepolia } from "viem/chains";
import { getNativePrice } from "./cowApi/fetchNativePrice";
import { getCoingeckoUsdPrice } from "./coingeckoApi";

export async function fetchPairUsdPrice({
  baseToken,
  quoteToken,
  chainId,
}: {
  baseToken: IToken;
  quoteToken: IToken;
  chainId: ChainId;
}): Promise<number> {
  const [baseTokenUsdPrice, quoteTokenUsdPrice] = await Promise.all([
    fetchTokenUsdPrice({
      tokenAddress: baseToken.address,
      tokenDecimals: baseToken.decimals,
      chainId: chainId,
    }),
    fetchTokenUsdPrice({
      tokenAddress: quoteToken.address,
      tokenDecimals: quoteToken.decimals,
      chainId: chainId,
    }),
  ]);
  return baseTokenUsdPrice / quoteTokenUsdPrice;
}

/**
 * Fetches USD price for a given currency from coingecko or CowProtocol
 * CoW Protocol Orderbook API is used as a fallback
 * When Coingecko rate limit is hit, CowProtocol will be used for 1 minute
 */
export async function fetchTokenUsdPrice({
  tokenAddress,
  tokenDecimals,
  chainId,
}: {
  tokenAddress: Address;
  tokenDecimals: number;
  chainId: ChainId;
}): Promise<number> {
  try {
    return await getCoingeckoUsdPrice({
      chainId,
      address: tokenAddress,
    });
  } catch (error) {
    return getCowProtocolUsdPrice({ chainId, tokenAddress, tokenDecimals });
  }
}

export const USDC: Record<ChainId, IToken> = {
  [mainnet.id]: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    symbol: "USDC",
  },
  [gnosis.id]: {
    address: "0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83",
    decimals: 6,
    symbol: "USDC",
  },
  [sepolia.id]: {
    address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
    decimals: 18,
    symbol: "USDC (test)",
  },
};

export async function getCowProtocolUsdPrice({
  chainId,
  tokenAddress,
  tokenDecimals,
}: {
  chainId: ChainId;
  tokenAddress: Address;
  tokenDecimals: number;
}): Promise<number> {
  const usdcToken = USDC[chainId];
  const [usdNativePrice, tokenNativePrice] = await Promise.all([
    getNativePrice(USDC[chainId].address as Address, chainId),
    getNativePrice(tokenAddress, chainId),
  ]);

  if (usdNativePrice && tokenNativePrice) {
    const usdPrice = invertNativeToTokenPrice(
      usdNativePrice,
      usdcToken.decimals
    );
    const tokenPrice = invertNativeToTokenPrice(
      tokenNativePrice,
      tokenDecimals
    );

    if (!tokenPrice) throw new Error("Token price is 0");

    return usdPrice / tokenPrice;
  }

  throw new Error("Failed to fetch native price");
}

/**
 * API response value represents the amount of native token atoms needed to buy 1 atom of the specified token
 * This function inverts the price to represent the amount of specified token atoms needed to buy 1 atom of the native token
 */
function invertNativeToTokenPrice(value: number, decimals: number): number {
  const inverted = 1 / value;
  return inverted * 10 ** (18 - decimals);
}
