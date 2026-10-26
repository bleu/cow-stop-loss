import type { Address, PublicClient } from "viem";

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
  sellMaxAge,
  buyMaxAge,
}: {
  chainId: ChainId;
  route: IRoute;
  maxAge?: number;
  sellMaxAge?: number;
  buyMaxAge?: number;
}) {
  return readOraclePairPrice({
    client: publicClientsFromIds[chainId],
    route,
    maxAge,
    sellMaxAge,
    buyMaxAge,
  });
}

export async function fetchOracleUsdPriceSnapshot({
  chainId,
  oracle,
  maxAge = 24 * 60 * 60,
  client = publicClientsFromIds[chainId],
}: {
  chainId: ChainId;
  oracle: Address;
  maxAge?: number;
  client?: PublicClient;
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
  const block = await client.getBlock();
  return readOraclePrice({
    client,
    oracle,
    blockNumber: block.number,
    timestamp: block.timestamp,
    maxAge: approvedMaxAge,
  });
}

export async function fetchOracleUsdPrice(
  args: Parameters<typeof fetchOracleUsdPriceSnapshot>[0],
) {
  const { price } = await fetchOracleUsdPriceSnapshot(args);
  if (!Number.isFinite(price) || price <= 0)
    throw new Error("Oracle price is unavailable");
  return price;
}
