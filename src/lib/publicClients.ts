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

export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
  blockExplorers: {
    default: {
      name: "Blockscout",
      url: "https://robinhoodchain.blockscout.com",
    },
  },
  contracts: {
    multicall3: { address: "0xcA11bde05977b3631167028862bE2a173976CA11" },
  },
});

export const walletChains = [
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
  {
    ...robinhood,
    iconUrl: CHAIN_ASSETS[robinhood.id].icon,
    iconBackground: CHAIN_ASSETS[robinhood.id].color,
  },
] as const;

export type WalletChainId = (typeof walletChains)[number]["id"];
export type ChainId = WalletChainId;
export type ChainType = Chain & { id: ChainId };
export type ChainName = keyof typeof publicClientsFromNames;

export const supportedChains = walletChains;
export const supportedChainIds = supportedChains.map((chain) => chain.id);

export function isSupportedChainId(
  chainId: number | undefined,
): chainId is ChainId {
  return supportedChainIds.some((id) => id === chainId);
}

export function assertOrderChainEnabled(chainId: number) {
  if (!isSupportedChainId(chainId))
    throw new Error("Stop-loss orders are unavailable on this network.");
}

export function isConfiguredChainId(chainId: number): chainId is ChainId {
  return walletChains.some(({ id }) => id === chainId);
}

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
  [robinhood.id]: robinhood.name,
};

type DrpcChainId = Exclude<ChainId, typeof robinhood.id>;

const DRPC_NETWORKS = {
  [mainnet.id]: "ethereum",
  [gnosis.id]: "gnosis",
  [sepolia.id]: "sepolia",
  [arbitrum.id]: "arbitrum",
  [base.id]: "base",
  [polygon.id]: "polygon",
  [avalanche.id]: "avalanche",
  [bsc.id]: "bsc",
  [linea.id]: "linea",
  [plasma.id]: "plasma",
} as const satisfies Record<DrpcChainId, string>;

const drpcKey = process.env.NEXT_PUBLIC_DRPC_KEY;

function rpcUrl(chainId: DrpcChainId, defaultUrl: string): string {
  return drpcKey
    ? `https://lb.drpc.live/${DRPC_NETWORKS[chainId]}/${encodeURIComponent(drpcKey)}`
    : defaultUrl;
}

export const RPC_PROVIDERS = {
  [mainnet.id]: rpcUrl(mainnet.id, "https://ethereum-rpc.publicnode.com"),
  [gnosis.id]: rpcUrl(gnosis.id, gnosis.rpcUrls.default.http[0]),
  [sepolia.id]: rpcUrl(sepolia.id, sepolia.rpcUrls.default.http[0]),
  [arbitrum.id]: rpcUrl(arbitrum.id, arbitrum.rpcUrls.default.http[0]),
  [base.id]: rpcUrl(base.id, base.rpcUrls.default.http[0]),
  [polygon.id]: rpcUrl(polygon.id, "https://polygon-bor-rpc.publicnode.com"),
  [avalanche.id]: rpcUrl(avalanche.id, avalanche.rpcUrls.default.http[0]),
  [bsc.id]: rpcUrl(bsc.id, "https://bsc-dataseed1.bnbchain.org"),
  [linea.id]: rpcUrl(linea.id, linea.rpcUrls.default.http[0]),
  [plasma.id]: rpcUrl(plasma.id, plasma.rpcUrls.default.http[0]),
  [robinhood.id]:
    process.env.NEXT_PUBLIC_ROBINHOOD_RPC_URL ||
    robinhood.rpcUrls.default.http[0],
} as const satisfies Record<ChainId, string>;

export function createRpcTransport(chain: ChainType) {
  return http(RPC_PROVIDERS[chain.id], { retryCount: 1, timeout: 10000 });
}

export function createWalletRpcTransports() {
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
    [robinhood.id]: createRpcTransport(robinhood),
  } satisfies Record<WalletChainId, ReturnType<typeof createRpcTransport>>;
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
  robinhood: createClientForChain(robinhood),
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
  [robinhood.id]: publicClientsFromNames.robinhood,
} as const satisfies Record<ChainId, ReturnType<typeof createClientForChain>>;
