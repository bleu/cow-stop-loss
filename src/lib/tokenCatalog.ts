import type { Address } from "viem";
import type { ChainId } from "./publicClients";
import type { Oracles } from "./oracleRouter";
import data from "./tokenCatalogData.json";

export interface CatalogToken {
  chainId: ChainId;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

function catalogChainId(chainId: number): ChainId {
  switch (chainId) {
    case 1:
    case 100:
    case 42161:
    case 8453:
    case 137:
    case 43114:
    case 56:
    case 59144:
    case 9745:
    case 11155111:
      return chainId;
    default:
      throw new Error(`Unsupported catalog chain: ${chainId}`);
  }
}

export const TOKEN_CATALOG: CatalogToken[] = data.tokens.map(
  ({ oracles: _oracles, ...token }) => ({
    ...token,
    chainId: catalogChainId(token.chainId),
    address: token.address as Address,
  }),
);

export const TOKEN_ORACLES: Partial<Record<ChainId, Record<string, Oracles>>> =
  {};
for (const token of data.tokens) {
  const chainId = catalogChainId(token.chainId);
  const chainOracles = (TOKEN_ORACLES[chainId] ??= {});
  chainOracles[token.address.toLowerCase()] = token.oracles as Oracles;
}

function requireCatalogToken(chainId: ChainId, address: string): CatalogToken {
  const token = TOKEN_CATALOG.find(
    (item) =>
      item.chainId === chainId &&
      item.address.toLowerCase() === address.toLowerCase(),
  );
  if (!token) throw new Error(`Missing catalog buy token on chain ${chainId}`);
  return token;
}

export const USD_TOKENS = {
  1: requireCatalogToken(1, data.usdTokens["1"]),
  100: requireCatalogToken(100, data.usdTokens["100"]),
  42161: requireCatalogToken(42161, data.usdTokens["42161"]),
  8453: requireCatalogToken(8453, data.usdTokens["8453"]),
  137: requireCatalogToken(137, data.usdTokens["137"]),
  43114: requireCatalogToken(43114, data.usdTokens["43114"]),
  56: requireCatalogToken(56, data.usdTokens["56"]),
  59144: requireCatalogToken(59144, data.usdTokens["59144"]),
  9745: requireCatalogToken(9745, data.usdTokens["9745"]),
  11155111: requireCatalogToken(11155111, data.usdTokens["11155111"]),
} satisfies Record<ChainId, CatalogToken>;

export function findTokenOracles(
  chainId: number,
  address: Address | string,
): Oracles {
  return TOKEN_ORACLES[chainId as ChainId]?.[address.toLowerCase()] ?? {};
}
