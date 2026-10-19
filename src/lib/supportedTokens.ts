import type { Address } from "viem";
import { sepolia } from "viem/chains";

import type { Oracles } from "./oracleRouter";
import type { ChainId } from "./publicClients";
import {
  catalogUnavailableReason,
  findTokenOracleApprovals,
  findTokenOracles,
  type OracleApprovals,
  TOKEN_CATALOG,
  USD_TOKENS,
} from "./tokenCatalog";
import type { IToken } from "./types";

export interface TokenWithPriceFeed {
  token: IToken;
  oracles: Oracles;
  oracleApprovals?: OracleApprovals;
  priceFeed?: Address;
}

export interface SupportedTokens {
  sellTokens: TokenWithPriceFeed[];
  buyToken: TokenWithPriceFeed;
  unavailableReason?: string;
}

function configuredToken(
  token: IToken,
  oracles: Oracles,
  oracleApprovals: OracleApprovals,
): TokenWithPriceFeed {
  return { token, oracles, oracleApprovals, priceFeed: oracles.USD };
}

const sepoliaTokens: SupportedTokens = {
  // Sepolia keeps fixed test feeds and only the EOA WETH sell token.
  sellTokens: [
    configuredToken(
      {
        address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
        symbol: "WETH",
        decimals: 18,
      },
      { USD: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509" },
      { USD: { maxAgeSeconds: 24 * 60 * 60 } },
    ),
  ],
  buyToken: configuredToken(
    {
      address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
      symbol: "USDC (test)",
      decimals: 18,
    },
    { USD: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7" },
    { USD: { maxAgeSeconds: 24 * 60 * 60 } },
  ),
};

const historicalTokens: Partial<Record<ChainId, IToken[]>> = {
  1: [
    {
      address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
      symbol: "WBTC",
      decimals: 8,
    },
  ],
  100: [
    {
      address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
      symbol: "USDC.e",
      decimals: 6,
    },
  ],
};

export function findKnownToken(
  chainId: ChainId,
  address: Address | string,
): IToken | undefined {
  return [
    ...(chainId === sepolia.id
      ? [
          ...sepoliaTokens.sellTokens.map(({ token }) => token),
          sepoliaTokens.buyToken.token,
        ]
      : []),
    ...TOKEN_CATALOG.filter((token) => token.chainId === chainId),
    ...(historicalTokens[chainId] ?? []),
  ].find((token) => token.address.toLowerCase() === address.toLowerCase());
}

export function getSupportedTokens(chainId: ChainId): SupportedTokens {
  if (chainId === sepolia.id) return sepoliaTokens;
  const buyToken = USD_TOKENS[chainId];
  if (!buyToken) throw new Error("Unsupported chain");
  const buyOracles = findTokenOracles(chainId, buyToken.address);
  const configuredBuy = configuredToken(
    buyToken,
    buyOracles,
    findTokenOracleApprovals(chainId, buyToken.address),
  );
  const unavailableReason =
    catalogUnavailableReason(chainId) ??
    (!buyOracles.USD && !buyOracles.ETH
      ? "New orders are unavailable: the fixed buy token has no approved price feed."
      : undefined);
  if (unavailableReason)
    return { sellTokens: [], buyToken: configuredBuy, unavailableReason };
  const sellTokens = TOKEN_CATALOG.filter((token) => {
    if (
      token.chainId !== chainId ||
      token.address.toLowerCase() === buyToken.address.toLowerCase() ||
      token.assetClass !== "volatile"
    )
      return false;
    const oracles = findTokenOracles(chainId, token.address);
    return Boolean(
      (oracles.ETH && buyOracles.ETH) || (oracles.USD && buyOracles.USD),
    );
  }).map((token) =>
    configuredToken(
      token,
      findTokenOracles(chainId, token.address),
      findTokenOracleApprovals(chainId, token.address),
    ),
  );
  sellTokens.sort(
    (a, b) =>
      Number(b.token.symbol === "WETH") - Number(a.token.symbol === "WETH"),
  );
  return {
    sellTokens,
    buyToken: configuredBuy,
    ...(sellTokens.length === 0
      ? {
          unavailableReason:
            "New orders are unavailable: no sell token has an approved oracle route.",
        }
      : {}),
  };
}
