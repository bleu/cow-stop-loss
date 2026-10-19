import {
  type Chain,
  createPublicClient,
  defineChain,
  http,
  type PublicClient,
} from "viem";
import {
  arbitrum,
  avalanche,
  base,
  bsc,
  gnosis,
  linea,
  mainnet,
  polygon,
  sepolia,
} from "viem/chains";

import { CHAIN_ASSETS } from "./chainAssets";

// Matches viem's Plasma definition, which is absent from the locked version.
export const plasma = defineChain({
  id: 9745,
  name: "Plasma",
  nativeCurrency: { name: "Plasma", symbol: "XPL", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.plasma.to"] } },
  blockExplorers: {
    default: { name: "PlasmaScan", url: "https://plasmascan.to" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0,
    },
  },
});

export const supportedChains = [
  mainnet,
  { ...sepolia, name: "Sepolia (testnet)" },
  gnosis,
  { ...arbitrum, name: "Arbitrum" },
  base,
  polygon,
  avalanche,
  { ...bsc, name: "BNB Chain" },
  {
    ...linea,
    name: "Linea",
    iconUrl: CHAIN_ASSETS[linea.id].icon,
    iconBackground: CHAIN_ASSETS[linea.id].color,
  },
  {
    ...plasma,
    iconUrl: CHAIN_ASSETS[plasma.id].icon,
    iconBackground: CHAIN_ASSETS[plasma.id].color,
  },
] as const;

export type ChainId = (typeof supportedChains)[number]["id"];
export type ChainType = Chain & { id: ChainId };
export type ChainName = keyof typeof publicClientsFromNames;

export const supportedChainIds = supportedChains.map((chain) => chain.id);

export const chainNames: Record<ChainId, string> = {
  1: "Ethereum",
  100: "Gnosis",
  42161: "Arbitrum",
  8453: "Base",
  137: "Polygon",
  43114: "Avalanche",
  56: "BNB Chain",
  59144: "Linea",
  9745: "Plasma",
  11155111: "Sepolia (testnet)",
};

export const RPC_PROVIDERS = {
  [mainnet.id]:
    process.env.NEXT_PUBLIC_RPC_URL_MAINNET ||
    "https://ethereum-rpc.publicnode.com",
  [gnosis.id]:
    process.env.NEXT_PUBLIC_RPC_URL_GNOSIS || gnosis.rpcUrls.default.http[0],
  [sepolia.id]:
    process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || sepolia.rpcUrls.default.http[0],
  [arbitrum.id]:
    process.env.NEXT_PUBLIC_RPC_URL_ARBITRUM ||
    arbitrum.rpcUrls.default.http[0],
  [base.id]:
    process.env.NEXT_PUBLIC_RPC_URL_BASE || base.rpcUrls.default.http[0],
  [polygon.id]:
    process.env.NEXT_PUBLIC_RPC_URL_POLYGON ||
    "https://polygon-bor-rpc.publicnode.com",
  [avalanche.id]:
    process.env.NEXT_PUBLIC_RPC_URL_AVALANCHE ||
    avalanche.rpcUrls.default.http[0],
  [bsc.id]:
    process.env.NEXT_PUBLIC_RPC_URL_BNB || "https://bsc-dataseed1.bnbchain.org",
  [linea.id]:
    process.env.NEXT_PUBLIC_RPC_URL_LINEA || linea.rpcUrls.default.http[0],
  [plasma.id]:
    process.env.NEXT_PUBLIC_RPC_URL_PLASMA || plasma.rpcUrls.default.http[0],
} as const satisfies Record<ChainId, string>;

export function createRpcTransport(chain: ChainType) {
  return http(RPC_PROVIDERS[chain.id], { retryCount: 1, timeout: 10000 });
}

export function createRpcTransports() {
  return {
    [mainnet.id]: createRpcTransport(mainnet),
    [gnosis.id]: createRpcTransport(gnosis),
    [sepolia.id]: createRpcTransport(sepolia),
    [arbitrum.id]: createRpcTransport(arbitrum),
    [base.id]: createRpcTransport(base),
    [polygon.id]: createRpcTransport(polygon),
    [avalanche.id]: createRpcTransport(avalanche),
    [bsc.id]: createRpcTransport(bsc),
    [linea.id]: createRpcTransport(linea),
    [plasma.id]: createRpcTransport(plasma),
  } satisfies Record<ChainId, ReturnType<typeof createRpcTransport>>;
}

export function createClientForChain(chain: ChainType): PublicClient {
  const clientChain: Chain = chain;
  return createPublicClient({
    chain: clientChain,
    transport: createRpcTransport(chain),
    cacheTime: 0,
  });
}

export const publicClientsFromNames = {
  gnosis: createClientForChain(gnosis),
  mainnet: createClientForChain(mainnet),
  sepolia: createClientForChain(sepolia),
  arbitrum: createClientForChain(arbitrum),
  base: createClientForChain(base),
  polygon: createClientForChain(polygon),
  avalanche: createClientForChain(avalanche),
  bnb: createClientForChain(bsc),
  linea: createClientForChain(linea),
  plasma: createClientForChain(plasma),
};

export const publicClientsFromIds = {
  [gnosis.id]: publicClientsFromNames.gnosis,
  [mainnet.id]: publicClientsFromNames.mainnet,
  [sepolia.id]: publicClientsFromNames.sepolia,
  [arbitrum.id]: publicClientsFromNames.arbitrum,
  [base.id]: publicClientsFromNames.base,
  [polygon.id]: publicClientsFromNames.polygon,
  [avalanche.id]: publicClientsFromNames.avalanche,
  [bsc.id]: publicClientsFromNames.bnb,
  [linea.id]: publicClientsFromNames.linea,
  [plasma.id]: publicClientsFromNames.plasma,
} as const satisfies Record<ChainId, ReturnType<typeof createClientForChain>>;
