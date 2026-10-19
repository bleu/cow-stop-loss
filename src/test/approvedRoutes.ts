import type { Address } from "viem";

import type { Oracles } from "#/lib/oracleRouter";
import type { ChainId } from "#/lib/publicClients";
import type {
  SupportedTokens,
  TokenWithPriceFeed,
} from "#/lib/supportedTokens";
import { TOKEN_CATALOG, USD_TOKENS } from "#/lib/tokenCatalog";

// These fixtures simulate approval for algorithm and EOA tests. They do not certify production feeds.
function testApprovedToken(
  chainId: ChainId,
  symbol: string,
  oracles: Oracles,
): TokenWithPriceFeed {
  const token = TOKEN_CATALOG.find(
    (item) => item.chainId === chainId && item.symbol === symbol,
  );
  if (!token) throw new Error(`Missing TEST token ${chainId}:${symbol}`);
  return {
    token,
    oracles,
    priceFeed: oracles.USD,
    oracleApprovals: Object.fromEntries(
      Object.keys(oracles).map((quote) => [quote, { maxAgeSeconds: 86400 }]),
    ),
  };
}

function testApprovedPair(
  chainId: ChainId,
  wethOracle: Address,
  buyOracle: Address,
): SupportedTokens {
  return {
    sellTokens: [testApprovedToken(chainId, "WETH", { USD: wethOracle })],
    buyToken: testApprovedToken(chainId, USD_TOKENS[chainId].symbol, {
      USD: buyOracle,
    }),
  };
}

export const TEST_SUPPORTED_TOKENS: Partial<Record<ChainId, SupportedTokens>> =
  {
    1: {
      sellTokens: [
        testApprovedToken(1, "WETH", {
          USD: "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419",
        }),
        testApprovedToken(1, "cbBTC", {
          USD: "0x2665701293fcbeb223d11a08d826563edcce423a",
        }),
        testApprovedToken(1, "AAVE", {
          ETH: "0x6df09e975c830ecae5bd4ed9d90f3a95a4f88012",
          USD: "0x547a514d5e3769680ce22b2361c10ea13619e8a9",
        }),
        testApprovedToken(1, "AMPL", {
          ETH: "0x492575fdd11a0fcf2c6c719867890a7648d526eb",
        }),
      ],
      buyToken: testApprovedToken(1, "USDC", {
        ETH: "0x986b5e1e1755e3c2440e960477f25201b0a8bbd4",
        USD: "0x8fffffd4afb6115b954bd326cbe7b4ba576818f6",
      }),
    },
    100: testApprovedPair(
      100,
      "0xa767f745331d267c7751297d982b050c93985627",
      "0x68811d7df835b1c33e6eeae8e7c141ef48d48cc7",
    ),
    42161: testApprovedPair(
      42161,
      "0x639fe6ab55c921f74e7fac1ee960c0b6293ba612",
      "0x50834f3163758fcc1df9973b6e91f0f0f0434ad3",
    ),
  };
