import type { Address } from "viem";

import type { Oracles } from "./oracleRouter";
import type { ChainId } from "./publicClients";
import data from "./tokenCatalogData.json";

export type AssetClass =
  | "volatile"
  | "usd-pegged"
  | "usd-linked"
  | "other-stable"
  | "unknown";

export interface OracleApproval {
  maxAgeSeconds: number;
}

export type OracleApprovals = Partial<Record<keyof Oracles, OracleApproval>>;

export interface CatalogToken {
  assetClass: AssetClass;
  chainId: ChainId;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  logoURI: string;
}

function catalogChainId(chainId: number): ChainId {
  switch (chainId) {
    case 1:
    case 100:
    case 42161:
    case 8453:
    case 137:
    case 43114:
    case 56:
    case 59144:
    case 9745:
    case 11155111:
      return chainId;
    default:
      throw new Error(`Unsupported catalog chain: ${chainId}`);
  }
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function assetClass(value: unknown): AssetClass {
  return value === "volatile" ||
    value === "usd-pegged" ||
    value === "usd-linked" ||
    value === "other-stable"
    ? value
    : "unknown";
}

export const TOKEN_CATALOG: CatalogToken[] = data.tokens.map((token) => ({
  chainId: catalogChainId(token.chainId),
  address: token.address as Address,
  symbol: token.symbol,
  name: token.name,
  decimals: token.decimals,
  logoURI: token.logoURI,
  assetClass: assetClass(record(token).assetClass),
}));

function reviewedDecision(value: unknown, decision: string): boolean {
  const review = record(value);
  if (
    review.decision !== decision ||
    typeof review.evidence !== "string" ||
    !review.evidence.trim() ||
    typeof review.reviewDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(review.reviewDate)
  )
    return false;
  const timestamp = Date.parse(`${review.reviewDate}T00:00:00Z`);
  return (
    Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === review.reviewDate &&
    timestamp <= Date.now()
  );
}

export function parseOracleApprovals(value: unknown): {
  oracles: Oracles;
  oracleApprovals: OracleApprovals;
} {
  const token = record(value);
  const oracles: Oracles = {};
  const oracleApprovals: OracleApprovals = {};
  for (const quote of ["USD", "ETH"] as const) {
    const proxy = record(token.oracles)[quote];
    const approval = record(record(token.oracleApprovals)[quote]);
    if (
      typeof proxy !== "string" ||
      !/^0x[0-9a-fA-F]{40}$/.test(proxy) ||
      approval.chainId !== token.chainId ||
      typeof token.address !== "string" ||
      typeof approval.tokenAddress !== "string" ||
      approval.tokenAddress.toLowerCase() !== token.address.toLowerCase() ||
      approval.quote !== quote ||
      ("sourceCategorySuitability" in approval &&
        (!reviewedDecision(approval.sourceCategorySuitability, "accepted") ||
          (record(approval.sourceCategorySuitability).category !== "medium" &&
            record(approval.sourceCategorySuitability).category !== "new"))) ||
      (approval.assetRelationship !== "exact-asset" &&
        approval.assetRelationship !== "native-wrapper" &&
        approval.assetRelationship !== "bridged-underlying") ||
      ((approval.assetRelationship === "bridged-underlying" ||
        "representationSuitability" in approval) &&
        (approval.assetRelationship !== "bridged-underlying" ||
          !reviewedDecision(
            approval.representationSuitability,
            "accepted-underlying-feed",
          ) ||
          record(approval.representationSuitability).bridgeRisk !==
            "not-priced-by-feed")) ||
      typeof approval.proxyAddress !== "string" ||
      approval.proxyAddress.toLowerCase() !== proxy.toLowerCase() ||
      typeof approval.maxAgeSeconds !== "number" ||
      !Number.isSafeInteger(approval.maxAgeSeconds) ||
      approval.maxAgeSeconds <= 0 ||
      ![
        "path",
        "snapshotFingerprint",
        "identityEvidence",
        "representationEvidence",
        "assetRelationshipReason",
        "methodologyEvidence",
        "sourceEvidence",
        "expectedDescription",
      ].every(
        (field) =>
          typeof approval[field] === "string" &&
          (approval[field] as string).trim().length > 0,
      ) ||
      typeof approval.reviewDate !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(approval.reviewDate) ||
      typeof approval.expectedDecimals !== "number" ||
      !Number.isInteger(approval.expectedDecimals) ||
      approval.expectedDecimals < 0 ||
      approval.expectedDecimals > 18
    )
      continue;
    oracles[quote] = proxy as Address;
    oracleApprovals[quote] = { maxAgeSeconds: approval.maxAgeSeconds };
  }
  return { oracles, oracleApprovals };
}

export function catalogUnavailableReason(chainId: ChainId): string | undefined {
  const chain = record(record(record(data).chains)[String(chainId)]);
  if (
    chain.status === "approved" &&
    ["executionEvidence", "arithmeticBoundsEvidence", "reviewDate"].every(
      (field) =>
        typeof chain[field] === "string" &&
        (chain[field] as string).trim().length > 0,
    )
  )
    return undefined;
  return typeof chain.unavailableReason === "string" && chain.unavailableReason
    ? chain.unavailableReason
    : "New orders are unavailable on this network: oracle route approval is incomplete.";
}

export const TOKEN_ORACLES: Partial<Record<ChainId, Record<string, Oracles>>> =
  {};
const TOKEN_ORACLE_APPROVALS: Partial<
  Record<ChainId, Record<string, OracleApprovals>>
> = {};
for (const token of data.tokens) {
  const chainId = catalogChainId(token.chainId);
  const parsed = parseOracleApprovals(token);
  (TOKEN_ORACLES[chainId] ??= {})[token.address.toLowerCase()] = parsed.oracles;
  (TOKEN_ORACLE_APPROVALS[chainId] ??= {})[token.address.toLowerCase()] =
    parsed.oracleApprovals;
}

export function findTokenOracleApprovals(
  chainId: number,
  address: Address | string,
): OracleApprovals {
  return (
    TOKEN_ORACLE_APPROVALS[chainId as ChainId]?.[address.toLowerCase()] ?? {}
  );
}

function requireCatalogToken(chainId: ChainId, address: string): CatalogToken {
  const token = TOKEN_CATALOG.find(
    (item) =>
      item.chainId === chainId &&
      item.address.toLowerCase() === address.toLowerCase(),
  );
  if (!token) throw new Error(`Missing catalog buy token on chain ${chainId}`);
  return token;
}

export const USD_TOKENS = {
  1: requireCatalogToken(1, data.usdTokens["1"]),
  100: requireCatalogToken(100, data.usdTokens["100"]),
  42161: requireCatalogToken(42161, data.usdTokens["42161"]),
  8453: requireCatalogToken(8453, data.usdTokens["8453"]),
  137: requireCatalogToken(137, data.usdTokens["137"]),
  43114: requireCatalogToken(43114, data.usdTokens["43114"]),
  56: requireCatalogToken(56, data.usdTokens["56"]),
  59144: requireCatalogToken(59144, data.usdTokens["59144"]),
  9745: requireCatalogToken(9745, data.usdTokens["9745"]),
  11155111: requireCatalogToken(11155111, data.usdTokens["11155111"]),
} satisfies Record<ChainId, CatalogToken>;

export function findTokenOracles(
  chainId: number,
  address: Address | string,
): Oracles {
  return TOKEN_ORACLES[chainId as ChainId]?.[address.toLowerCase()] ?? {};
}
