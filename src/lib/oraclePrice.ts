import type { Address } from "viem";

import { readOraclePrice } from "./oracleRouter";
import {
  ChainId,
  publicClientsFromIds,
  supportedChainIds,
} from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";

export function configuredTokenOracle(tokenAddress: Address, chainId: ChainId) {
  if (!supportedChainIds.includes(chainId)) return undefined;
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  return [...sellTokens, buyToken].find(
    ({ token }) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
  )?.priceFeed;
}

export async function fetchOracleUsdPrice({
  chainId,
  oracle,
  maxAge = 24 * 60 * 60,
}: {
  chainId: ChainId;
  oracle: Address;
  maxAge?: number;
}) {
  const client = publicClientsFromIds[chainId];
  const block = await client.getBlock();
  const { price } = await readOraclePrice({
    client,
    oracle,
    blockNumber: block.number,
    timestamp: block.timestamp,
    maxAge,
  });
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Oracle price is unavailable");
  return price;
}
