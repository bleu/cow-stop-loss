import { existsSync, readFileSync } from "fs";
import path from "path";
import { isAddress, zeroAddress } from "viem";

import { networkFor, networkIdFor } from "../../utils";
import { CHAIN_INFO } from "../chainInfo";
import { COW_API_URL_BY_CHAIN_ID } from "../cowApi/api";
import { getExplorerOrderLink } from "../cowExplorer";
import { CHAINS_ORACLE_ROUTER_FACTORY } from "../oracleRouter";
import {
  publicClientsFromIds,
  RPC_PROVIDERS,
  supportedChainIds,
} from "../publicClients";
import { getSupportedTokens } from "../supportedTokens";
import { findTokenOracles, TOKEN_CATALOG, USD_TOKENS } from "../tokenCatalog";

type Identity = {
  chainId: number;
  address: string;
  localLogo: string;
  logoSource: string;
  logoSha256: string;
};
type MetadataFields = { symbol: string; name: string; decimals: number };
type MetadataOverride = Pick<Identity, "chainId" | "address"> & {
  metadata: Partial<MetadataFields>;
  expected?: Partial<MetadataFields>;
  reason: string;
};
type Feed = { path: string; proxyAddress: string };
type Approval = Feed & { chainId: number; tokenAddress: string; quote: string };

function read<T>(filename: string): T {
  return JSON.parse(
    readFileSync(path.join(process.cwd(), "scripts", filename), "utf8"),
  ) as T;
}

function key(token: { chainId: number; address: string }): string {
  return `${token.chainId}:${token.address.toLowerCase()}`;
}

const identities = read<{ tokens: Identity[] }>("catalog-identities.json");
const byIdentity = new Map(
  identities.tokens.map((token) => [key(token), token]),
);
const overrides = read<{ tokens: MetadataOverride[] }>(
  "catalog-metadata-overrides.json",
);
const sources = read<{
  revision: string;
  sources: { id: string; url: string; sha256: string }[];
}>("catalog-metadata-sources.json");
const reviewedFeeds = read<Record<string, Feed[]>>("catalog-feeds.json");
const policy = read<{ approvals: Approval[] }>("catalog-policy.json");

it("covers the requested CoW EVM networks and preserves Sepolia", () => {
  expect([...supportedChainIds].sort((a, b) => a - b)).toEqual([
    1, 56, 100, 137, 8453, 9745, 42161, 43114, 59144, 11155111,
  ]);
  expect(
    Object.keys(USD_TOKENS)
      .map(Number)
      .sort((a, b) => a - b),
  ).toEqual([...supportedChainIds].sort((a, b) => a - b));
});

it.each(supportedChainIds)(
  "has complete configuration for chain %s",
  (chainId) => {
    const info = CHAIN_INFO[chainId];
    expect(info.label).toBeTruthy();
    expect(existsSync(path.join(process.cwd(), "public", info.icon))).toBe(
      true,
    );
    expect(publicClientsFromIds[chainId].chain?.id).toBe(chainId);
    expect(new URL(RPC_PROVIDERS[chainId]).protocol).toBe("https:");
    expect(new URL(COW_API_URL_BY_CHAIN_ID[chainId]).protocol).toBe("https:");
    expect(CHAINS_ORACLE_ROUTER_FACTORY[chainId]).toBeDefined();
    expect(Number(networkIdFor(networkFor(chainId)))).toBe(chainId);
    expect(getExplorerOrderLink(chainId, "0x1234")).not.toContain("undefined");
  },
);

it("has unique, valid token contracts and local images", () => {
  const keys = TOKEN_CATALOG.map(
    (token) => `${token.chainId}:${token.address.toLowerCase()}`,
  );
  expect(new Set(keys).size).toBe(keys.length);
  for (const token of TOKEN_CATALOG) {
    expect(supportedChainIds).toContain(token.chainId);
    expect(isAddress(token.address)).toBe(true);
    expect(token.address.toLowerCase()).not.toBe(zeroAddress);
    expect(Number.isInteger(token.decimals)).toBe(true);
    expect(token.decimals).toBeGreaterThanOrEqual(0);
    expect(token.decimals).toBeLessThanOrEqual(36);
    expect(token.symbol).toBeTruthy();
    expect(token.name).toBeTruthy();
    expect(token.logoURI.startsWith("/assets/tokens/")).toBe(true);
    const identity = byIdentity.get(key(token));
    expect(identity?.localLogo).toBe(token.logoURI);
    expect(identity?.logoSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(token.logoURI).toContain(identity!.logoSha256.slice(0, 20));
    expect(new URL(identity!.logoSource).protocol).toBe("https:");
  }
});

it.each(supportedChainIds.filter((id) => id !== 11155111))(
  "offers a small approved sell list on mainnet %s",
  async (chainId) => {
    const { sellTokens, buyToken, unavailableReason } =
      getSupportedTokens(chainId);
    expect(unavailableReason).toBeUndefined();
    expect(buyToken.token).toEqual(USD_TOKENS[chainId]);
    expect(sellTokens.length).toBeGreaterThan(0);
    expect(sellTokens.length).toBeLessThanOrEqual(3);
    const expectedSells = {
      1: ["LINK", "UNI", "WETH"],
      56: ["WBNB"],
      100: ["GNO"],
      137: ["WPOL"],
      8453: ["VIRTUAL"],
      9745: ["WXPL"],
      42161: ["WETH"],
      43114: ["WAVAX"],
      59144: ["WETH"],
    };
    expect(sellTokens.map(({ token }) => token.symbol).sort()).toEqual(
      expectedSells[chainId as keyof typeof expectedSells],
    );
    if (chainId === 8453)
      expect(sellTokens[0].token.address).toBe(
        "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
      );
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    for (const sell of sellTokens) {
      await expect(
        new Router({
          chainId,
          tokenSell: sell.token,
          tokenBuy: buyToken.token,
        }).findRoute(),
      ).resolves.toBeDefined();
    }
  },
);

it("keeps the designated buy token contracts unchanged", () => {
  expect(
    Object.fromEntries(
      Object.entries(USD_TOKENS).map(([chainId, token]) => [
        chainId,
        token.address.toLowerCase(),
      ]),
    ),
  ).toEqual({
    1: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
    56: "0x55d398326f99059ff775485246999027b3197955",
    100: "0x4ecaba5870353805a9f068101a40e0f32ed605c6",
    137: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
    8453: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    9745: "0x2d661c89d812261039af9764eceaaee884f5f67f",
    42161: "0xaf88d065e77c8cc2239327c5edb3a432268e5831",
    43114: "0xb97ef9ef8734c71904d8002f8b6bc66dd9c48a6e",
    59144: "0x176211869ca2b568f2a7d4ee941e073a821ee1ff",
    11155111: "0xbe72e441bf55620febc26715db68d3494213d8cb",
  });
});

it("does not expose feeds for metadata-only, unknown or cross-chain addresses", () => {
  const metadataOnly = "0x0555e30da8f98308edb960aa94c0db47230d2b9c";
  expect(
    TOKEN_CATALOG.find(
      (token) => token.chainId === 8453 && token.address === metadataOnly,
    ),
  ).toMatchObject({
    chainId: 8453,
    symbol: "WBTC",
  });
  expect(findTokenOracles(8453, metadataOnly.toUpperCase())).toEqual({});
  expect(findTokenOracles(8453, metadataOnly)).toEqual({});
  expect(
    findTokenOracles(8453, "0x0000000000000000000000000000000000000001"),
  ).toEqual({});
  expect(findTokenOracles(1, USD_TOKENS[8453].address)).toEqual({});
});

it("keeps reviewed identities without handwritten display metadata", () => {
  expect(identities.tokens.map(key).sort()).toEqual(
    TOKEN_CATALOG.map(key).sort(),
  );
  const imageHashes = new Map<string, string>();
  for (const identity of identities.tokens) {
    expect(identity).not.toHaveProperty("symbol");
    expect(identity).not.toHaveProperty("name");
    expect(identity).not.toHaveProperty("decimals");
    const existing = imageHashes.get(identity.localLogo);
    if (existing !== undefined) expect(identity.logoSha256).toBe(existing);
    imageHashes.set(identity.localLogo, identity.logoSha256);
  }
});

it("keeps local metadata only for reviewed gaps and field corrections", () => {
  const generated = new Map(TOKEN_CATALOG.map((token) => [key(token), token]));
  expect(new Set(overrides.tokens.map(key)).size).toBe(overrides.tokens.length);
  for (const override of overrides.tokens) {
    expect(override.reason.trim()).not.toBe("");
    expect(generated.get(key(override))).toMatchObject(override.metadata);
    const fields = Object.keys(override.metadata).sort();
    if (override.expected) {
      expect(Object.keys(override.expected).sort()).toEqual(fields);
      for (const field of ["symbol", "name", "decimals"] as const) {
        if (override.metadata[field] !== undefined)
          expect(override.metadata[field]).not.toBe(override.expected[field]);
      }
    } else {
      expect(fields).toEqual(["decimals", "name", "symbol"]);
    }
  }
});

it("pins external metadata to an immutable revision and content digests", () => {
  expect(sources.revision).toMatch(/^[a-f0-9]{40}$/);
  expect(new Set(sources.sources.map((source) => source.id)).size).toBe(
    sources.sources.length,
  );
  expect(sources.sources[0].id).toBe("cow");
  for (const source of sources.sources) {
    expect(
      source.url.startsWith(
        `https://raw.githubusercontent.com/cowprotocol/token-lists/${sources.revision}/src/public/`,
      ),
    ).toBe(true);
    expect(source.sha256).toMatch(/^[a-f0-9]{64}$/);
  }
});

it("exposes only feeds with exact reviewed rows and token approvals", () => {
  const reviewed = new Set<string>();
  for (const [chainId, feeds] of Object.entries(reviewedFeeds)) {
    expect(supportedChainIds.map(String)).toContain(chainId);
    const rows = feeds.map(
      (feed) => `${feed.path}:${feed.proxyAddress.toLowerCase()}`,
    );
    expect(new Set(rows).size).toBe(rows.length);
    for (const feed of feeds) {
      expect(feed.path.trim()).not.toBe("");
      expect(isAddress(feed.proxyAddress)).toBe(true);
      reviewed.add(`${chainId}:${feed.proxyAddress.toLowerCase()}`);
    }
  }
  for (const token of TOKEN_CATALOG) {
    for (const [quote, proxy] of Object.entries(
      findTokenOracles(token.chainId, token.address),
    )) {
      expect(reviewed.has(`${token.chainId}:${proxy.toLowerCase()}`)).toBe(
        true,
      );
      expect(
        policy.approvals.some(
          (approval) =>
            approval.chainId === token.chainId &&
            approval.tokenAddress.toLowerCase() ===
              token.address.toLowerCase() &&
            approval.quote === quote &&
            approval.proxyAddress.toLowerCase() === proxy.toLowerCase() &&
            reviewedFeeds[String(token.chainId)].some(
              (feed) =>
                feed.path === approval.path &&
                feed.proxyAddress.toLowerCase() === proxy.toLowerCase(),
            ),
        ),
      ).toBe(true);
    }
  }
});
