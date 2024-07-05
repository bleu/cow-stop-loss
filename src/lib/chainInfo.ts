import { gnosis, mainnet, sepolia } from "viem/chains";

export const COW_PROTOCOL_LINK = "https://cow.fi/";

import { ChainId } from "./publicClients";

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
  },
};

export const CHAIN_INFO_ARRAY: BaseChainInfo[] = Object.values(CHAIN_INFO);

export function getChainInfo(chainId: ChainId): BaseChainInfo {
  return CHAIN_INFO[chainId];
}
