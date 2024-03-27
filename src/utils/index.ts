import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Address } from "viem";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address?: string | null) {
  if (!address) return address;

  const match = address.match(/^([a-zA-Z0-9]{6})[a-zA-Z0-9]+([a-zA-Z0-9]{4})$/);
  if (!match) return address;

  return `${match[1]}…${match[2]}`;
}

type Notation = "compact" | "engineering" | "scientific" | "standard";

export const formatNumber = (
  number: number | string | bigint,
  decimals = 1,
  style = "decimal",
  notation: Notation = "compact",
  lessThanThresholdToReplace = 0.001
) => {
  if (number === 0) return "0";
  if (Math.abs(Number(number)) < lessThanThresholdToReplace) {
    return `< ${lessThanThresholdToReplace.toLocaleString("en-US")}`;
  }

  return Number(number).toLocaleString("en-US", {
    notation,
    maximumFractionDigits: decimals,
    style,
  });
};

export function numberToPercent(value?: number) {
  if (!value) return undefined;
  return value * 100;
}

export function percentToNumber(value: number) {
  return value / 100;
}

export enum Network {
  Ethereum = "ethereum",
  Polygon = "polygon",
  Arbitrum = "arbitrum",
  Gnosis = "gnosis",
  Optimism = "optimism",
  Goerli = "goerli",
  Sepolia = "sepolia",
  PolygonZKEVM = "polygon-zkevm",
  Base = "base",
  Avalanche = "avalanche",
}

export enum NetworkChainId {
  ETHEREUM = 1,
  POLYGON = 137,
  ARBITRUM = 42_161,
  GNOSIS = 100,
  OPTIMISM = 10,
  GOERLI = 5,
  SEPOLIA = 11_155_111,
  POLYGONZKEVM = 1_101,
  BASE = 8453,
  AVALANCHE = 43114,
}

export const NetworkChainIdFromNetwork = {
  [Network.Ethereum]: NetworkChainId.ETHEREUM,
  [Network.Polygon]: NetworkChainId.POLYGON,
  [Network.Arbitrum]: NetworkChainId.ARBITRUM,
  [Network.Gnosis]: NetworkChainId.GNOSIS,
  [Network.Optimism]: NetworkChainId.OPTIMISM,
  [Network.Goerli]: NetworkChainId.GOERLI,
  [Network.Sepolia]: NetworkChainId.SEPOLIA,
  [Network.PolygonZKEVM]: NetworkChainId.POLYGONZKEVM,
  [Network.Base]: NetworkChainId.BASE,
  [Network.Avalanche]: NetworkChainId.AVALANCHE,
};

export const NetworkFromNetworkChainId = {
  [NetworkChainId.ETHEREUM]: Network.Ethereum,
  [NetworkChainId.POLYGON]: Network.Polygon,
  [NetworkChainId.ARBITRUM]: Network.Arbitrum,
  [NetworkChainId.GNOSIS]: Network.Gnosis,
  [NetworkChainId.OPTIMISM]: Network.Optimism,
  [NetworkChainId.GOERLI]: Network.Goerli,
  [NetworkChainId.SEPOLIA]: Network.Sepolia,
  [NetworkChainId.POLYGONZKEVM]: Network.PolygonZKEVM,
  [NetworkChainId.BASE]: Network.Base,
  [NetworkChainId.AVALANCHE]: Network.Avalanche,
};

export const networkUrls = {
  [NetworkChainId.ETHEREUM]: {
    url: "https://etherscan.io/",
    name: "Etherscan",
  },
  [NetworkChainId.POLYGON]: {
    url: "https://polygonscan.com/",
    name: "Polygon Chain Explorer",
  },
  [NetworkChainId.ARBITRUM]: {
    url: "https://arbiscan.io/",
    name: "Arbitrum Chain Explorer",
  },
  [NetworkChainId.GNOSIS]: {
    url: "https://gnosisscan.io/",
    name: "Gnosis Chain Explorer",
  },
  [NetworkChainId.OPTIMISM]: {
    url: "https://optimistic.etherscan.io/",
    name: "Optimistic Chain Explorer",
  },
  [NetworkChainId.GOERLI]: {
    url: "https://goerli.etherscan.io/",
    name: "Goerli Chain Explorer",
  },
  [NetworkChainId.SEPOLIA]: {
    url: "https://sepolia.etherscan.io/",
    name: "Sepolia Chain Explorer",
  },
  [NetworkChainId.POLYGONZKEVM]: {
    url: "https://zkevm.polygonscan.com/",
    name: "Polygon zkEVM Chain Explorer",
  },
  [NetworkChainId.BASE]: {
    url: "https://basescan.org/",
    name: "Base Chain Explorer",
  },
  [NetworkChainId.AVALANCHE]: {
    url: "https://snowtrace.io/",
    name: "Avalanche C-Chain Explorer",
  },
};

export function buildBlockExplorerTxUrl({
  chainId,
  txHash,
}: {
  chainId?: NetworkChainId;
  txHash: string;
}) {
  if (!chainId) return undefined;
  const networkUrl = networkUrls[chainId as keyof typeof networkUrls];
  return `${networkUrl.url}tx/${txHash}`;
}

export function buildBlockExplorerTokenURL({
  chainId,
  tokenAddress,
}: {
  chainId?: NetworkChainId;
  tokenAddress: Address;
}) {
  if (!chainId) return undefined;
  const networkUrl = networkUrls[chainId as keyof typeof networkUrls];
  return `${networkUrl.url}token/${tokenAddress}`;
}

export function buildBlockExplorerAddressURL({
  chainId,
  address,
}: {
  chainId?: NetworkChainId;
  address: Address;
}) {
  if (!chainId) return undefined;
  const networkUrl = networkUrls[chainId as keyof typeof networkUrls];
  return {
    url: `${networkUrl.url}address/${address}`,
    name: networkUrl.name,
  };
}

export const DELEGATE_OWNER = "0xBA1BA1ba1BA1bA1bA1Ba1BA1ba1BA1bA1ba1ba1B";

// TODO: is this still supposed to be here?
export const networkMultisigs = {
  [Network.Ethereum]: "0x10A19e7eE7d7F8a52822f6817de8ea18204F2e4f",
  [Network.Polygon]: "0xeE071f4B516F69a1603dA393CdE8e76C40E5Be85",
  [Network.Arbitrum]: "0xaF23DC5983230E9eEAf93280e312e57539D098D0",
};

export const networkIdEnumMap = {
  "1": Network.Ethereum,
  "137": Network.Polygon,
  "42161": Network.Arbitrum,
  "100": Network.Gnosis,
  "10": Network.Optimism,
  "5": Network.Goerli,
  "11155111": Network.Sepolia,
  "1101": Network.PolygonZKEVM,
  "43114": Network.Avalanche,
  "8453": Network.Base,
};

const networksNamesOnBalancer = [
  String(NetworkChainId.ETHEREUM),
  String(NetworkChainId.OPTIMISM),
  String(NetworkChainId.GNOSIS),
  String(NetworkChainId.POLYGON),
  String(NetworkChainId.POLYGONZKEVM),
  String(NetworkChainId.ARBITRUM),
  String(NetworkChainId.AVALANCHE),
  String(NetworkChainId.BASE),
];

export const networksOnBalancer = Object.fromEntries(
  Object.entries(networkIdEnumMap).filter(([key]) =>
    networksNamesOnBalancer.includes(key)
  )
);

export function networkFor(key?: string | number) {
  if (!key) {
    return Network.Ethereum;
  }
  return networkIdEnumMap[key.toString() as keyof typeof networkIdEnumMap];
}

export function networkIdFor(name?: string) {
  if (!name) {
    return "1";
  }

  return unsafeNetworkIdFor(name) || "1";
}

export function unsafeNetworkIdFor(name: string) {
  return Object.keys(networkIdEnumMap).find(
    (key) => networkIdEnumMap[key as keyof typeof networkIdEnumMap] === name
  );
}

export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export const addressRegex = /0x[a-fA-F0-9]{40}$/;

/**
 * Formats a date in the "Month Day, Year" (American) format.
 *
 * @param {Date} date - The input date to be formatted.
 * @returns {string} A string representing the formatted date.
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function formatDateToLocalDatetime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function convertAndRoundDown(value: string) {
  const num = parseFloat(value);
  const integerPartLength = Math.floor(num).toString().length;
  const maxDecimalPlaces = Math.max(0, 15 - integerPartLength);
  const scale = Math.pow(10, maxDecimalPlaces);
  return Math.floor(num * scale) / scale;
}

/* eslint-disable @typescript-eslint/ban-types */
export type GetDeepProp<T extends object, K extends string> = K extends keyof T
  ? T[K]
  : { [P in keyof T]: GetDeepProp<Extract<T[P], object>, K> }[keyof T];

export type ArrElement<ArrType> = ArrType extends readonly (infer ElementType)[]
  ? ElementType
  : never;


  export const epochToDate = (epoch: number): Date => {
    return new Date(epoch * 1000);
  };