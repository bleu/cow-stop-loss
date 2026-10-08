import { Address } from "viem";

import { ChainId } from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";
import { COW_API_URL_BY_CHAIN_ID } from "./api";

export interface INativePrice {
  price: number;
}

export async function getNativePrice(
  tokenAddress: Address,
  chainId: ChainId,
): Promise<number> {
  const url = COW_API_URL_BY_CHAIN_ID[chainId];

  return fetch(`${url}/api/v1/token/${tokenAddress}/native_price`, {
    headers: {
      Accept: "application/json",
    },
  })
    .then((response) => response.json() as Promise<INativePrice>)
    .then((data) => data.price);
}

export async function getCowProtocolUsdPrice({
  chainId,
  tokenAddress,
  tokenDecimals,
}: {
  chainId: ChainId;
  tokenAddress: Address;
  tokenDecimals: number;
}): Promise<number> {
  const usdcToken = getSupportedTokens(chainId).buyToken.token;
  const [usdNativePrice, tokenNativePrice] = await Promise.all([
    getNativePrice(usdcToken.address, chainId),
    getNativePrice(tokenAddress, chainId),
  ]);

  if (usdNativePrice && tokenNativePrice) {
    const usdPrice = invertNativeToTokenPrice(
      usdNativePrice,
      usdcToken.decimals,
    );
    const tokenPrice = invertNativeToTokenPrice(
      tokenNativePrice,
      tokenDecimals,
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
