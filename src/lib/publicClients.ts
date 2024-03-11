import { createPublicClient, http } from "viem";
import { gnosis, mainnet, sepolia } from "viem/chains";

export type ChainType = typeof mainnet | typeof gnosis | typeof sepolia;

export type ChainName = "mainnet" | "gnosis" | "sepolia";

export type ChainId = typeof mainnet.id | typeof gnosis.id | typeof sepolia.id;

export function createClientForChain(chain: ChainType) {
  return createPublicClient({
    chain,
    transport: http(),
  });
};

export const publicClientsFromNames = {
  mainnet: createClientForChain(mainnet),
  sepolia: createClientForChain(sepolia),
  gnosis: createClientForChain(gnosis),
} as const;

export const publicClientsFromIds = {
  [gnosis.id]: createClientForChain(gnosis),
  [mainnet.id]: createClientForChain(mainnet),
  [sepolia.id]: createClientForChain(sepolia),
} as const;
