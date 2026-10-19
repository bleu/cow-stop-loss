// from https://github.com/cowprotocol/cowswap/blob/develop/libs/common-utils/src/explorer.ts

import { CHAIN_INFO } from "./chainInfo";
import { ChainId } from "./publicClients";

/**
 * Unique identifier for the order: 56 bytes encoded as hex with `0x` prefix.
 * Bytes 0..32 are the order digest, bytes 30..52 the owner address and bytes
 * 52..56 the expiry (`validTo`) as a `uint32` unix epoch timestamp.
 *
 */
export type UID = string;

export function getExplorerBaseUrl(chainId: ChainId): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_COW_EXPLORER_URL_PROD || "https://explorer.cow.fi";
  const chainInfo = CHAIN_INFO[chainId];

  if (!chainInfo) {
    throw new Error(
      "Unsupported Network. The operator API is not deployed in the Network " +
        chainId,
    );
  }

  return chainInfo.urlAlias ? `${baseUrl}/${chainInfo.urlAlias}` : baseUrl;
}

export function getExplorerOrderLink(chainId: ChainId, orderId: UID): string {
  const baseUrl = getExplorerBaseUrl(chainId);

  return baseUrl + `/orders/${orderId}`;
}

export function getExplorerAddressLink(
  chainId: ChainId,
  address: string,
): string {
  const baseUrl = getExplorerBaseUrl(chainId);

  return baseUrl + `/address/${address}`;
}

enum Explorers {
  Explorer = "Explorer",
  Blockscout = "Blockscout",
  Etherscan = "Etherscan",
  Arbiscan = "Arbiscan",
}

// Used for GA ExternalLink detection
export function detectExplorer(href: string) {
  if (href.includes("explorer")) {
    return Explorers.Explorer;
  } else if (href.includes("blockscout")) {
    return Explorers.Blockscout;
  } else if (href.includes("etherscan")) {
    return Explorers.Etherscan;
  } else if (href.includes("arbiscan")) {
    return Explorers.Arbiscan;
  } else {
    return undefined;
  }
}
