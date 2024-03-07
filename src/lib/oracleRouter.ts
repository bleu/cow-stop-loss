import { Address, PublicClient } from "viem";
import { IToken } from "./types";
import { ChainId, publicClientsFromIds } from "./publicClients";
import { PRICE_FEED_REGISTER } from "./contracts";
import { gnosis, mainnet, sepolia } from "viem/chains";
import { priceFeedRegisterAbi } from "./abis/priceFeedRegister";

export interface OracleFinderArgs {
  chainId: ChainId;
  token: IToken;
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
  sellToken: IToken;
  buyToken: IToken;
}

export interface IGnosisPriceFeedItem {
  address: Address;
  pair: [string, string];
}

abstract class OracleRouter {
  chainId: ChainId;
  sellToken: IToken;
  buyToken: IToken;

  constructor({ chainId, sellToken, buyToken }: IOracleRouterArgs) {
    this.chainId = chainId;
    this.sellToken = sellToken;
    this.buyToken = buyToken;
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
}

class MainnetRouter extends OracleRouter {
  ETH_REGISTER_REFERENCE: Address;
  USD_REGISTER_REFERENCE: Address;

  constructor({ chainId, sellToken, buyToken }: IOracleRouterArgs) {
    super({ chainId, sellToken, buyToken });
    this.ETH_REGISTER_REFERENCE = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
    this.USD_REGISTER_REFERENCE = "0x0000000000000000000000000000000000000348";
  }

  async getOracleFromRegistry(
    publicClient: PublicClient,
    base: Address,
    quote: Address
  ) {
    return publicClient
      .readContract({
        address: PRICE_FEED_REGISTER[mainnet.id],
        abi: priceFeedRegisterAbi,
        functionName: "getFeed",
        args: [base, quote],
      })
      .catch(() => undefined);
  }

  async findOracles({ chainId, token }: OracleFinderArgs): Promise<Oracles> {
    const publicClient = publicClientsFromIds[chainId];
    const [ETH_ORACLE, USD_ORACLE] = await Promise.all([
      this.getOracleFromRegistry(
        publicClient,
        token.address,
        this.ETH_REGISTER_REFERENCE
      ),
      this.getOracleFromRegistry(
        publicClient,
        token.address,
        this.USD_REGISTER_REFERENCE
      ),
    ]);

    return {
      ETH: ETH_ORACLE,
      USD: USD_ORACLE,
    };
  }

  async findBuyOracle(): Promise<Oracles> {
    return this.findOracles({ chainId: this.chainId, token: this.buyToken });
  }

  async findSellOracle(): Promise<Oracles> {
    return this.findOracles({ chainId: this.chainId, token: this.sellToken });
  }
}

class GnosisRouter extends OracleRouter {
  PRICE_FEEDS_URL: string;

  constructor(args: IOracleRouterArgs) {
    super(args);
    this.PRICE_FEEDS_URL =
      "https://reference-data-directory.vercel.app/feeds-xdai-mainnet.json";
  }

  async fetchPriceFeeds() {
    const response = await fetch(this.PRICE_FEEDS_URL);
    return response.json() as Promise<IGnosisPriceFeedItem[]>;
  }

  async findOracle(token: IToken): Promise<Oracles> {
    const feeds = await this.fetchPriceFeeds();
    const ETH_ORACLE = feeds.find(
      (feed) => feed.pair.includes("ETH") && feed.pair.includes(token.symbol)
    );
    const USD_ORACLE = feeds.find(
      (feed) => feed.pair.includes("USD") && feed.pair.includes(token.symbol)
    );
    return {
      ETH: ETH_ORACLE?.address,
      USD: USD_ORACLE?.address,
    };
  }

  async findBuyOracle(): Promise<Oracles> {
    return this.findOracle(this.buyToken);
  }

  async findSellOracle(): Promise<Oracles> {
    return this.findOracle(this.sellToken);
  }
}

class SepoliaRouter extends OracleRouter {
  async findBuyOracle(): Promise<Oracles> {
    return { ETH: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7" };
  }

  async findSellOracle(): Promise<Oracles> {
    return { ETH: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509" };
  }
}

// export const CHAINS_ORACLE_ROUTER_FACTORY: Record<
//   ChainId,
//   new (args: IOracleRouterArgs) => OracleRouter
// > = {
//   [mainnet.id]: MainnetRouter,
//   [sepolia.id]: SepoliaRouter,
//   [gnosis.id]: GnosisRouter,
// };
export const CHAINS_ORACLE_ROUTER_FACTORY = {
  [mainnet.id]: MainnetRouter,
  // [sepolia.id]: SepoliaRouter,
  // [gnosis.id]: GnosisRouter,
};
