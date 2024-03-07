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
  contractAddress: Address;
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

export const WETH_MAINNET_ADDRESS =
  "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const WETH_GNOSIS_ADDRESS = "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1";

export class MainnetRouter extends OracleRouter {
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
    // WETH is a special case, it`s not on the registry so we should use the ETH reference
    const addressToFind =
      token.address.toLowerCase() === WETH_MAINNET_ADDRESS.toLowerCase()
        ? this.ETH_REGISTER_REFERENCE
        : token.address;
    const [ETH_ORACLE, USD_ORACLE] = await Promise.all([
      this.getOracleFromRegistry(
        publicClient,
        addressToFind,
        this.ETH_REGISTER_REFERENCE
      ),
      this.getOracleFromRegistry(
        publicClient,
        addressToFind,
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

export class GnosisRouter extends OracleRouter {
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
    // WETH is a special case, it`s not on the price feeds so we should use ETH
    const symbolToFind =
      token.address.toLowerCase() === WETH_GNOSIS_ADDRESS.toLowerCase()
        ? "ETH"
        : token.symbol;
    const feeds = await this.fetchPriceFeeds();
    const ETH_ORACLE = feeds.find(
      (feed) => feed.pair[0] === symbolToFind && feed.pair[1] === "ETH"
    );
    const USD_ORACLE = feeds.find(
      (feed) => feed.pair[0] === symbolToFind && feed.pair[1] === "USD"
    );

    return {
      ETH: ETH_ORACLE?.contractAddress,
      USD: USD_ORACLE?.contractAddress,
    };
  }

  async findBuyOracle(): Promise<Oracles> {
    return this.findOracle(this.buyToken);
  }

  async findSellOracle(): Promise<Oracles> {
    return this.findOracle(this.sellToken);
  }
}

export class SepoliaRouter extends OracleRouter {
  // Sepolia is a testnet, so we always return the same oracles for testing purposes
  async findBuyOracle(): Promise<Oracles> {
    return { ETH: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7" };
  }

  async findSellOracle(): Promise<Oracles> {
    return { ETH: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509" };
  }
}

export const CHAINS_ORACLE_ROUTER_FACTORY: Record<
  ChainId,
  new (args: IOracleRouterArgs) => OracleRouter
> = {
  [mainnet.id]: MainnetRouter,
  [sepolia.id]: SepoliaRouter,
  [gnosis.id]: GnosisRouter,
};
