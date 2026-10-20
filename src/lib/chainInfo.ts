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

export const COW_PROTOCOL_LINK = "https://cow.fi/";

import { CHAIN_ASSETS } from "./chainAssets";
import { type ChainId, plasma } from "./publicClients";

export interface BaseChainInfo {
  readonly docs: string;
  readonly bridge?: string;
  readonly explorer: string;
  readonly infoLink: string;
  readonly name: string;
  readonly addressPrefix: string;
  readonly label: string;
  readonly urlAlias: string;
  readonly helpCenterUrl?: string;
  readonly explorerTitle: string;
  readonly color: string;
  readonly icon: string;
}

export type ChainInfoMap = Record<ChainId, BaseChainInfo>;

export const CHAIN_INFO: ChainInfoMap = {
  [mainnet.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://etherscan.io",
    infoLink: COW_PROTOCOL_LINK,
    label: "Ethereum",
    name: "mainnet",
    addressPrefix: "eth",
    explorerTitle: "Etherscan",
    urlAlias: "",
    ...CHAIN_ASSETS[mainnet.id],
  },
  [gnosis.id]: {
    docs: "https://docs.gnosischain.com",
    bridge: "https://bridge.gnosischain.com/",
    explorer: "https://gnosisscan.io",
    infoLink: "https://www.gnosischain.com",
    label: "Gnosis Chain",
    name: "gnosis_chain",
    addressPrefix: "gno",
    explorerTitle: "Gnosisscan",
    urlAlias: "gc",
    ...CHAIN_ASSETS[gnosis.id],
  },
  [sepolia.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://sepolia.etherscan.io",
    infoLink: COW_PROTOCOL_LINK,
    label: "Sepolia",
    name: "sepolia",
    addressPrefix: "sep",
    explorerTitle: "Etherscan",
    urlAlias: "sepolia",
    ...CHAIN_ASSETS[sepolia.id],
  },
  [arbitrum.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://arbiscan.io",
    infoLink: COW_PROTOCOL_LINK,
    label: "Arbitrum One",
    name: "arbitrum_one",
    addressPrefix: "arb1",
    explorerTitle: "Arbiscan",
    urlAlias: "arb1",
    ...CHAIN_ASSETS[arbitrum.id],
  },
  [base.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://basescan.org",
    infoLink: COW_PROTOCOL_LINK,
    label: "Base",
    name: "base",
    addressPrefix: "base",
    explorerTitle: "Basescan",
    urlAlias: "base",
    ...CHAIN_ASSETS[base.id],
  },
  [polygon.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://polygonscan.com",
    infoLink: COW_PROTOCOL_LINK,
    label: "Polygon",
    name: "polygon",
    addressPrefix: "matic",
    explorerTitle: "Polygonscan",
    urlAlias: "pol",
    ...CHAIN_ASSETS[polygon.id],
  },
  [avalanche.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://snowscan.xyz",
    infoLink: COW_PROTOCOL_LINK,
    label: "Avalanche",
    name: "avalanche",
    addressPrefix: "avax",
    explorerTitle: "Snowscan",
    urlAlias: "avax",
    ...CHAIN_ASSETS[avalanche.id],
  },
  [bsc.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://bscscan.com",
    infoLink: COW_PROTOCOL_LINK,
    label: "BNB Chain",
    name: "bnb",
    addressPrefix: "bnb",
    explorerTitle: "Bscscan",
    urlAlias: "bnb",
    ...CHAIN_ASSETS[bsc.id],
  },
  [linea.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://lineascan.build",
    infoLink: COW_PROTOCOL_LINK,
    label: "Linea",
    name: "linea",
    addressPrefix: "linea",
    explorerTitle: "Lineascan",
    urlAlias: "linea",
    ...CHAIN_ASSETS[linea.id],
  },
  [plasma.id]: {
    docs: "https://docs.cow.fi",
    explorer: "https://plasmascan.to",
    infoLink: COW_PROTOCOL_LINK,
    label: "Plasma",
    name: "plasma",
    addressPrefix: "plasma",
    explorerTitle: "PlasmaScan",
    urlAlias: "plasma",
    ...CHAIN_ASSETS[plasma.id],
  },
};

export const CHAIN_INFO_ARRAY: BaseChainInfo[] = Object.values(CHAIN_INFO);

export function getChainInfo(chainId: ChainId): BaseChainInfo {
  return CHAIN_INFO[chainId];
}
