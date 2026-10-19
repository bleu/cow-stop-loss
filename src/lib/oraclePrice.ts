import type { Address } from "viem";

import {
  type IRoute,
  readOraclePairPrice,
  readOraclePrice,
} from "./oracleRouter";
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
  )?.oracles.USD;
}

export async function fetchOraclePairPrice({
  chainId,
  route,
  maxAge,
}: {
  chainId: ChainId;
  route: IRoute;
  maxAge?: number;
}) {
  return readOraclePairPrice({
    client: publicClientsFromIds[chainId],
    route,
    maxAge,
  });
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
  const { sellTokens, buyToken } = getSupportedTokens(chainId);
  const configured = [...sellTokens, buyToken].filter(
    ({ oracles }) => oracles.USD?.toLowerCase() === oracle.toLowerCase(),
  );
  const ceilings = configured.map(
    ({ oracleApprovals }) => oracleApprovals?.USD?.maxAgeSeconds,
  );
  if (
    configured.length === 0 ||
    ceilings.some(
      (ceiling) => !ceiling || !Number.isSafeInteger(ceiling) || ceiling <= 0,
    )
  ) {
    throw new Error("No configured USD price feed");
  }
  const approvedMaxAge = Math.min(maxAge, ...(ceilings as number[]));
  const client = publicClientsFromIds[chainId];
  const block = await client.getBlock();
  const { price } = await readOraclePrice({
    client,
    oracle,
    blockNumber: block.number,
    timestamp: block.timestamp,
    maxAge: approvedMaxAge,
  });
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Oracle price is unavailable");
  return price;
}
