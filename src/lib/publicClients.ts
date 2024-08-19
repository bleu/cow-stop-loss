import { createPublicClient, http } from "viem";
import { arbitrum, gnosis, mainnet, sepolia } from "viem/chains";

export type ChainType = (typeof supportedChains)[number];

export type ChainName = "gnosis" | "mainnet" | "sepolia" | "arbitrum";

export type ChainId = (typeof supportedChainIds)[number];

export const supportedChains = [gnosis, mainnet, sepolia, arbitrum] as const;

export const supportedChainIds = [
  mainnet.id,
  gnosis.id,
  sepolia.id,
  arbitrum.id,
] as const;

export const RPC_PROVIDERS = {
  [mainnet.id]: process.env.NEXT_PUBLIC_RPC_URL_MAINNET,
  [gnosis.id]: process.env.NEXT_PUBLIC_RPC_URL_GNOSIS,
  [sepolia.id]: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA,
  [arbitrum.id]: process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM,
} as const;

export function createClientForChain(chain: ChainType) {
  return createPublicClient({
    chain,
    transport: http(RPC_PROVIDERS[chain.id]),
    cacheTime: 0,
  });
}

export const publicClientsFromNames = {
  gnosis: createClientForChain(gnosis),
  mainnet: createClientForChain(mainnet),
  sepolia: createClientForChain(sepolia),
  arbitrum: createClientForChain(arbitrum),
};

export const publicClientsFromIds = {
  [gnosis.id]: createClientForChain(gnosis),
  [mainnet.id]: createClientForChain(mainnet),
  [sepolia.id]: createClientForChain(sepolia),
  [arbitrum.id]: createClientForChain(arbitrum),
} as const;
