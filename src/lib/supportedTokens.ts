import type { Address } from "viem";
import { arbitrum, gnosis, mainnet, sepolia } from "viem/chains";

import type { ChainId } from "./publicClients";
import type { IToken } from "./types";

interface TokenWithPriceFeed {
  token: IToken;
  priceFeed: Address;
}

interface SupportedTokens {
  sellTokens: TokenWithPriceFeed[];
  buyToken: TokenWithPriceFeed;
}

const supportedTokens: Record<ChainId, SupportedTokens> = {
  [mainnet.id]: {
    sellTokens: [
      {
        token: {
          address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
          symbol: "WETH",
          decimals: 18,
        },
        priceFeed: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      },
      {
        token: {
          address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
          symbol: "WBTC",
          decimals: 8,
        },
        // WBTC uses BTC/USD under the 1:1 price assumption.
        priceFeed: "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
      },
    ],
    buyToken: {
      token: {
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        symbol: "USDC",
        decimals: 6,
      },
      priceFeed: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    },
  },
  [gnosis.id]: {
    sellTokens: [
      {
        token: {
          address: "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
          symbol: "WETH",
          decimals: 18,
        },
        priceFeed: "0xa767f745331D267c7751297D982b050c93985627",
      },
      {
        token: {
          address: "0x8e5bbbb09ed1ebde8674cda39a0c169401db4252",
          symbol: "WBTC",
          decimals: 8,
        },
        priceFeed: "0x00288135bE38B83249F380e9b6b9a04c90EC39eE",
      },
    ],
    buyToken: {
      token: {
        address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0",
        symbol: "USDC.e",
        decimals: 6,
      },
      priceFeed: "0x26C31ac71010aF62E6B486D1132E266D6298857D",
    },
  },
  [arbitrum.id]: {
    sellTokens: [
      {
        token: {
          address: "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
          symbol: "WETH",
          decimals: 18,
        },
        priceFeed: "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612",
      },
      {
        token: {
          address: "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
          symbol: "WBTC",
          decimals: 8,
        },
        priceFeed: "0xd0C7101eACbB49F3deCcCc166d238410D6D46d57",
      },
    ],
    buyToken: {
      token: {
        address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
        symbol: "USDC",
        decimals: 6,
      },
      priceFeed: "0x50834F3163758fcC1Df9973b6e91f0F0F0434aD3",
    },
  },
  [sepolia.id]: {
    // Sepolia keeps fixed sell/buy feeds for testing, not token-specific prices.
    sellTokens: [
      {
        token: {
          address: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14",
          symbol: "WETH",
          decimals: 18,
        },
        priceFeed: "0x57Cb700070Cb1b0475E2D668FA8E89cF0Dda9509",
      },
    ],
    buyToken: {
      token: {
        address: "0xbe72E441BF55620febc26715db68d3494213D8Cb",
        symbol: "USDC (test)",
        decimals: 18,
      },
      priceFeed: "0xEd2D417d759b1E77fe6A8920C79AE4CE6D6930F7",
    },
  },
};

export function getSupportedTokens(chainId: ChainId): SupportedTokens {
  const tokens = supportedTokens[chainId];
  if (!tokens) throw new Error("Unsupported chain");
  return tokens;
}
