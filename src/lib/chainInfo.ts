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

import { ChainId, plasma } from "./publicClients";

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
    color: "#62688F",
    icon: "/assets/chains/ethereum.svg",
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
    color: "#07795B",
    icon: "/assets/chains/gnosis.svg",
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
    color: "#C12FF2",
    icon: "/assets/chains/ethereum.svg",
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
    color: "#29B6AF",
    icon: "/assets/chains/arbitrum.svg",
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
    color: "#0052FF",
    icon: "/assets/chains/base.svg",
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
    color: "#8247E5",
    icon: "/assets/chains/polygon.svg",
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
    color: "#FF3944",
    icon: "/assets/chains/avalanche.svg",
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
    color: "#F0B90B",
    icon: "/assets/chains/bnb.svg",
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
    color: "#61DFFF",
    icon: "/assets/chains/linea.svg",
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
    color: "#569F8C",
    icon: "/assets/chains/plasma.svg",
  },
};

export const CHAIN_INFO_ARRAY: BaseChainInfo[] = Object.values(CHAIN_INFO);

export function getChainInfo(chainId: ChainId): BaseChainInfo {
  return CHAIN_INFO[chainId];
}
