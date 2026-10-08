import { Address, formatUnits, PublicClient } from "viem";
import { arbitrum, gnosis, mainnet, sepolia } from "viem/chains";

import { oracleMinimalAbi } from "./abis/oracleMinimalAbi";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { getSupportedTokens } from "./supportedTokens";
import { IToken } from "./types";

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
}

export abstract class OracleRouter {
  publicClient: PublicClient;
  chainId: ChainId;
  tokenSell: IToken;
  tokenBuy: IToken;

  constructor({ chainId, tokenSell, tokenBuy }: IOracleRouterArgs) {
    this.chainId = chainId;
    this.publicClient = publicClientsFromIds[chainId];
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

  async fetchOraclePrice(oracle: Address): Promise<number> {
    const [roundData, oracleDecimals] = await Promise.all([
      this.publicClient.readContract({
        address: oracle,
        abi: oracleMinimalAbi,
        functionName: "latestRoundData",
      }) as Promise<[bigint, bigint, bigint, bigint, bigint]>,
      this.publicClient.readContract({
        address: oracle,
        abi: oracleMinimalAbi,
        functionName: "decimals",
      }) as Promise<number>,
    ]);
    return Number(formatUnits(roundData[1], oracleDecimals));
  }

  async calculatePrice(route: IRoute): Promise<number> {
    try {
      const [sellPrice, buyPrice] = await Promise.all([
        this.fetchOraclePrice(route.tokenSellOracle),
        this.fetchOraclePrice(route.tokenBuyOracle),
      ]);
      return sellPrice / buyPrice;
    } catch {
      throw new Error(
        "Unable to read configured price feeds. Please try again.",
      );
    }
  }
}

export class ConfiguredRouter extends OracleRouter {
  async findBuyOracle(): Promise<Oracles> {
    const { buyToken } = getSupportedTokens(this.chainId);
    if (
      buyToken.token.address.toLowerCase() !==
      this.tokenBuy.address.toLowerCase()
    ) {
      throw new Error("Unsupported buy token");
    }
    return { USD: buyToken.priceFeed };
  }

  async findSellOracle(): Promise<Oracles> {
    const { sellTokens } = getSupportedTokens(this.chainId);
    const sellToken = sellTokens.find(
      ({ token }) =>
        token.address.toLowerCase() === this.tokenSell.address.toLowerCase(),
    );
    if (!sellToken) throw new Error("Unsupported sell token");
    return { USD: sellToken.priceFeed };
  }
}

export const CHAINS_ORACLE_ROUTER_FACTORY: Record<
  ChainId,
  new (args: IOracleRouterArgs) => OracleRouter
> = {
  [mainnet.id]: ConfiguredRouter,
  [sepolia.id]: ConfiguredRouter,
  [gnosis.id]: ConfiguredRouter,
  [arbitrum.id]: ConfiguredRouter,
};
