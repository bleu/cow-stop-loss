import { Address, formatUnits, PublicClient } from "viem";

import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import {
  ChainId,
  publicClientsFromIds,
  supportedChainIds,
} from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import { IToken } from "./types";

export type OracleRound = readonly [bigint, bigint, bigint, bigint, bigint];

export function validateOracleRound({
  round,
  timestamp,
  maxAge,
}: {
  round: OracleRound;
  timestamp: bigint;
  maxAge: number;
}) {
  if (!Number.isFinite(maxAge) || maxAge <= 0)
    throw new Error("Oracle time limit must be a positive finite number");
  if (
    round[0] <= BigInt(0) ||
    round[1] <= BigInt(0) ||
    round[3] <= BigInt(0) ||
    round[3] > timestamp ||
    round[4] < round[0]
  ) {
    throw new Error("Required price feed is invalid");
  }
  if (timestamp - round[3] > BigInt(Math.floor(maxAge))) {
    throw new Error(
      "Oracle price data is stale. Try again later, or increase the oracle time limit in Advanced Settings.",
    );
  }
}

export async function readOraclePrice({
  client,
  oracle,
  blockNumber,
  timestamp,
  maxAge,
}: {
  client: PublicClient;
  oracle: Address;
  blockNumber: bigint;
  timestamp: bigint;
  maxAge: number;
}) {
  if (!Number.isFinite(maxAge) || maxAge <= 0)
    throw new Error("Oracle time limit must be a positive finite number");
  const round = (await client.readContract({
    address: oracle,
    abi: oracleMinimalAbi,
    functionName: "latestRoundData",
    blockNumber,
  })) as OracleRound;
  validateOracleRound({ round, timestamp, maxAge });
  const decimals = (await client.readContract({
    address: oracle,
    abi: oracleMinimalAbi,
    functionName: "decimals",
    blockNumber,
  })) as number;
  return {
    answer: round[1],
    updatedAt: round[3],
    price: Number(formatUnits(round[1], decimals)),
  };
}

export interface Oracles {
  ETH?: Address;
  USD?: Address;
}

export interface IRoute {
  tokenSellOracle: Address;
  tokenBuyOracle: Address;
}

export interface IOracleRouterArgs {
  chainId: ChainId;
  tokenSell: IToken;
  tokenBuy: IToken;
  client?: PublicClient;
}

export abstract class OracleRouter {
  publicClient: PublicClient;
  chainId: ChainId;
  tokenSell: IToken;
  tokenBuy: IToken;

  constructor({ chainId, tokenSell, tokenBuy, client }: IOracleRouterArgs) {
    this.chainId = chainId;
    this.publicClient = client ?? publicClientsFromIds[chainId];
    this.tokenSell = tokenSell;
    this.tokenBuy = tokenBuy;
  }

  abstract findBuyOracle(): Promise<Oracles>;
  abstract findSellOracle(): Promise<Oracles>;

  matchOracles(tokenSellOracles: Oracles, tokenBuyOracles: Oracles): IRoute {
    if (tokenSellOracles.ETH && tokenBuyOracles.ETH) {
      return {
        tokenSellOracle: tokenSellOracles.ETH,
        tokenBuyOracle: tokenBuyOracles.ETH,
      };
    }
    if (tokenSellOracles.USD && tokenBuyOracles.USD) {
      return {
        tokenSellOracle: tokenSellOracles.USD,
        tokenBuyOracle: tokenBuyOracles.USD,
      };
    }
    throw new Error("No matching oracles found");
  }

  async findRoute(): Promise<IRoute> {
    const [tokenSellOracles, tokenBuyOracles] = await Promise.all([
      this.findSellOracle(),
      this.findBuyOracle(),
    ]);
    return this.matchOracles(tokenSellOracles, tokenBuyOracles);
  }

  async calculatePrice(route: IRoute, maxAge = 24 * 60 * 60): Promise<number> {
    return readOraclePairPrice({ client: this.publicClient, route, maxAge });
  }
}

export async function readOraclePairPrice({
  client,
  route,
  maxAge = 24 * 60 * 60,
  sellMaxAge = maxAge,
  buyMaxAge = maxAge,
}: {
  client: PublicClient;
  route: IRoute;
  maxAge?: number;
  sellMaxAge?: number;
  buyMaxAge?: number;
}): Promise<number> {
  const block = await client.getBlock();
  const prices = new Map<
    string,
    Promise<Awaited<ReturnType<typeof readOraclePrice>>>
  >();
  const read = (oracle: Address, feedMaxAge: number) => {
    const cappedMaxAge = Math.min(maxAge, feedMaxAge);
    const key = `${oracle.toLowerCase()}:${cappedMaxAge}`;
    if (!prices.has(key)) {
      prices.set(
        key,
        readOraclePrice({
          client: client,
          oracle,
          blockNumber: block.number,
          timestamp: block.timestamp,
          maxAge: cappedMaxAge,
        }),
      );
    }
    return prices.get(key)!;
  };
  const [sell, buy] = await Promise.all([
    read(route.tokenSellOracle, sellMaxAge),
    read(route.tokenBuyOracle, buyMaxAge),
  ]);
  const price = sell.price / buy.price;
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error("Oracle price is unavailable");
  }
  return price;
}

function matchesToken(token: IToken, configured: IToken) {
  return (
    token.address.toLowerCase() === configured.address.toLowerCase() &&
    token.decimals === configured.decimals &&
    token.symbol === configured.symbol
  );
}

function configuredPair({ chainId, tokenSell, tokenBuy }: IOracleRouterArgs) {
  const { sellTokens, buyToken, unavailableReason } =
    getSupportedTokens(chainId);
  if (unavailableReason) throw new Error(unavailableReason);
  if (!matchesToken(tokenBuy, buyToken.token))
    throw new Error("Unsupported buy token");
  const sellToken = sellTokens.find(({ token }) =>
    matchesToken(tokenSell, token),
  );
  if (!sellToken) throw new Error("Unsupported sell token");
  return { sellToken, buyToken };
}

function configuredRoute(args: IOracleRouterArgs) {
  const { sellToken, buyToken } = configuredPair(args);
  const quote = sellToken.oracles.ETH && buyToken.oracles.ETH ? "ETH" : "USD";
  const tokenSellOracle = sellToken.oracles[quote];
  const tokenBuyOracle = buyToken.oracles[quote];
  const sellMaxAge = sellToken.oracleApprovals?.[quote]?.maxAgeSeconds;
  const buyMaxAge = buyToken.oracleApprovals?.[quote]?.maxAgeSeconds;
  if (
    !tokenSellOracle ||
    !tokenBuyOracle ||
    !Number.isSafeInteger(sellMaxAge) ||
    !Number.isSafeInteger(buyMaxAge) ||
    !sellMaxAge ||
    sellMaxAge <= 0 ||
    !buyMaxAge ||
    buyMaxAge <= 0
  )
    throw new Error("No approved matching oracle route");
  return {
    route: { tokenSellOracle, tokenBuyOracle },
    maxAgeSeconds: Math.max(sellMaxAge, buyMaxAge),
    sellMaxAge,
    buyMaxAge,
  };
}

export function configuredTokenRoute(args: IOracleRouterArgs): IRoute {
  return configuredRoute(args).route;
}

export function configuredRouteMaxAges(args: IOracleRouterArgs) {
  const { sellMaxAge, buyMaxAge } = configuredRoute(args);
  return { sellMaxAge, buyMaxAge };
}

export function configuredRouteMaxAgeSeconds(args: IOracleRouterArgs): number {
  return configuredRoute(args).maxAgeSeconds;
}

export function assertOracleMaxAge(maxAge: number, ceiling: number): void {
  if (!Number.isFinite(maxAge) || maxAge < 1 || maxAge > ceiling)
    throw new Error(
      `Oracle time limit must be between 1 and ${ceiling} seconds for this route`,
    );
}

export function configuredChainMaxAgeSeconds(chainId: ChainId): number {
  const { sellTokens, buyToken, unavailableReason } =
    getSupportedTokens(chainId);
  if (unavailableReason || sellTokens.length === 0) return 24 * 60 * 60;
  return Math.max(
    ...sellTokens.map(({ token }) =>
      configuredRouteMaxAgeSeconds({
        chainId,
        tokenSell: token,
        tokenBuy: buyToken.token,
      }),
    ),
  );
}

export class ConfiguredRouter extends OracleRouter {
  async calculatePrice(route: IRoute, maxAge = 24 * 60 * 60): Promise<number> {
    const configured = configuredRoute(this);
    if (
      route.tokenSellOracle.toLowerCase() !==
        configured.route.tokenSellOracle.toLowerCase() ||
      route.tokenBuyOracle.toLowerCase() !==
        configured.route.tokenBuyOracle.toLowerCase()
    )
      throw new Error("Unsupported token or price-feed route");
    return readOraclePairPrice({
      client: this.publicClient,
      route,
      maxAge: Math.min(maxAge, configured.maxAgeSeconds),
      sellMaxAge: configured.sellMaxAge,
      buyMaxAge: configured.buyMaxAge,
    });
  }

  async findBuyOracle(): Promise<Oracles> {
    return configuredPair(this).buyToken.oracles;
  }

  async findSellOracle(): Promise<Oracles> {
    return configuredPair(this).sellToken.oracles;
  }

  async findRoute(): Promise<IRoute> {
    return configuredTokenRoute(this);
  }
}

export const CHAINS_ORACLE_ROUTER_FACTORY = Object.fromEntries(
  supportedChainIds.map((chainId) => [chainId, ConfiguredRouter]),
) as Record<ChainId, new (args: IOracleRouterArgs) => OracleRouter>;
