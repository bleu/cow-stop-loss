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
type Approval = Feed & {
  chainId: number;
  tokenAddress: string;
  quote: string;
  assetRelationship: string;
  sourceCategorySuitability?: unknown;
  boundedPriceSuitability?: unknown;
};

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
  "offers the exact reviewed sell contracts on mainnet %s",
  async (chainId) => {
    const { sellTokens, buyToken, unavailableReason } =
      getSupportedTokens(chainId);
    expect(unavailableReason).toBeUndefined();
    expect(buyToken.token).toEqual(USD_TOKENS[chainId]);
    const expectedSells = {
      1: [
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
        "0x514910771af9ca656af840dff83e8264ecf986ca",
        "0x1f9840a85d5af5bf1d1762f925bdaddc4201f984",
        "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9",
        "0xc00e94cb662c3520282e6f5717214004a7f26888",
        "0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf",
      ],
      56: [
        "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c",
        "0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82",
        "0x2170ed0880ac9a755fd29b2688956bd959f933f8",
        "0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd",
        "0xbf5140a22578168fd562dccf235e5d43a02ce9b1",
        "0xcf6bb5389c92bdda8a3747ddb454cb7a64626c63",
        "0xfceb31a79f71ac9cbdcf853519c1b12d379edc46",
        "0xfb6115445bff7b52feb98650c87f44907e58f802",
        "0xaec945e04baf28b135fa7c640f624f8d90f1c3a6",
      ],
      100: [
        "0x9c58bacc331c9aa871afd802db6379a98e80cedb",
        "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
        "0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2",
        "0xdf613af6b44a31299e48131e9347f034347e2f00",
        "0x4537e328bf7e4efa29d05caea260d7fe26af9d74",
        "0xdf6ff92bfdc1e8be45177dc1f4845d391d3ad8fd",
      ],
      137: [
        "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
        "0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39",
        "0xd6df932a45c0f255f85145f286ea0b292b21c90b",
        "0xb33eaad8d922b1083446dc23f610c2567fb5180f",
        "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
      ],
      8453: [
        "0x4200000000000000000000000000000000000006",
        "0x0b3e328455c4059eeb9e3f84b5543f74e24e7e1b",
        "0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196",
        "0x63706e401c06ac8513145b7687a14804d17f814b",
        "0x9e1028f5f1d5ede59748ffcee5532509976840e0",
      ],
      9745: [
        "0x6100e367285b01f48d07953803a2d8dca5d19873",
        "0x76a443768a5e3b8d1aed0105fc250877841deb40",
        "0x9895d81bb462a195b4922ed7de0e3acd007c32cb",
        "0xa3d68b74bf0528fdd07263c60d6488749044914b",
      ],
      42161: [
        "0x82af49447d8a07e3bd95bd0d56f35241523fbab1",
        "0x912ce59144191c1204e64559fe8253a0e49e6548",
        "0xf97f4df75117a78c1a5a0dbb814af92458539fb4",
        "0xba5ddd1f9d7f570dc94a51479a000e3bce967196",
        "0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0",
        "0x354a6da3fcde098f8389cad84b0182725c6c91de",
        "0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f",
      ],
      43114: [
        "0xb31f66aa3c1e785363f0875a1b74e27b85fd66c7",
        "0x63a72806098bd3d9520cc43356dd78afe5d386d9",
        "0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437",
        "0x5947bb275c521040051d82396192181b413227a3",
        "0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580",
        "0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab",
        "0x6e84a6216ea6dacc71ee8e6b0a5b7322eebc0fdd",
        "0x62edc0692bd897d2295872a9ffcac5425011c661",
      ],
      59144: [
        "0xe5d7c2a44ffddf6b295a15c148167daaaf5cf34f",
        "0xa18152629128738a5c081eb226335fed4b9c95e9",
        "0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f",
      ],
    };
    const addresses = sellTokens.map(({ token }) =>
      token.address.toLowerCase(),
    );
    expect(addresses.sort()).toEqual(
      expectedSells[chainId as keyof typeof expectedSells].sort(),
    );
    expect(new Set(addresses).size).toBe(addresses.length);
    if (chainId === 1) expect(sellTokens.length).toBeGreaterThanOrEqual(5);
    for (const { token } of sellTokens) {
      expect(token.address.toLowerCase()).not.toBe(
        buyToken.token.address.toLowerCase(),
      );
      expect(
        TOKEN_CATALOG.find(
          (known) =>
            known.chainId === chainId && known.address === token.address,
        )?.assetClass,
      ).toBe("volatile");
    }
    if (chainId === 8453)
      expect(sellTokens[0].token.address).toBe(
        "0x4200000000000000000000000000000000000006",
      );
    const Router = CHAINS_ORACLE_ROUTER_FACTORY[chainId];
    for (const sell of sellTokens) {
      const quote = sell.oracles.ETH && buyToken.oracles.ETH ? "ETH" : "USD";
      expect(sell.oracles[quote]).toBeDefined();
      expect(buyToken.oracles[quote]).toBeDefined();
      await expect(
        new Router({
          chainId,
          tokenSell: sell.token,
          tokenBuy: buyToken.token,
        }).findRoute(),
      ).resolves.toEqual({
        tokenSellOracle: sell.oracles[quote],
        tokenBuyOracle: buyToken.oracles[quote],
      });
    }
  },
);

it("pins reviewed underlying-feed approvals and the historical source-category review", () => {
  const approvalKey = (approval: Approval) =>
    `${approval.chainId}:${approval.tokenAddress.toLowerCase()}:${approval.quote}`;
  expect(
    policy.approvals
      .filter(
        ({ assetRelationship }) => assetRelationship === "bridged-underlying",
      )
      .map(approvalKey)
      .sort(),
  ).toEqual([
    "100:0x4537e328bf7e4efa29d05caea260d7fe26af9d74:USD",
    "100:0x4ecaba5870353805a9f068101a40e0f32ed605c6:USD",
    "100:0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1:USD",
    "100:0x9c58bacc331c9aa871afd802db6379a98e80cedb:USD",
    "100:0xdf613af6b44a31299e48131e9347f034347e2f00:USD",
    "100:0xdf6ff92bfdc1e8be45177dc1f4845d391d3ad8fd:USD",
    "100:0xe2e73a1c69ecf83f464efce6a5be353a37ca09b2:USD",
    "137:0x53e0bca35ec356bd5dddfebbd1fc0fd03fabad39:USD",
    "137:0x7ceb23fd6bc0add59e62ac25578270cff1b9f619:USD",
    "137:0xb33eaad8d922b1083446dc23f610c2567fb5180f:USD",
    "137:0xd6df932a45c0f255f85145f286ea0b292b21c90b:USD",
    "42161:0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f:USD",
    "42161:0x354a6da3fcde098f8389cad84b0182725c6c91de:USD",
    "42161:0xba5ddd1f9d7f570dc94a51479a000e3bce967196:USD",
    "42161:0xf97f4df75117a78c1a5a0dbb814af92458539fb4:USD",
    "42161:0xfa7f8980b0f1e64a2062791cc3b0871572f1f7f0:USD",
    "43114:0x49d5c2bdffac6ce2bfdb6640f4f80f226bc10bab:USD",
    "43114:0x5947bb275c521040051d82396192181b413227a3:USD",
    "43114:0x63a72806098bd3d9520cc43356dd78afe5d386d9:USD",
    "43114:0x8ebaf22b6f053dffeaf46f4dd9efa95d89ba8580:USD",
    "43114:0xc3048e19e76cb9a3aa9d77d8c03c29fc906e2437:USD",
    "56:0x2170ed0880ac9a755fd29b2688956bd959f933f8:USD",
    "56:0x55d398326f99059ff775485246999027b3197955:USD",
    "56:0xbf5140a22578168fd562dccf235e5d43a02ce9b1:USD",
    "56:0xf8a0bf9cf54bb92f17374d9e9a321e6a111a51bd:USD",
    "56:0xfb6115445bff7b52feb98650c87f44907e58f802:USD",
    "59144:0xa18152629128738a5c081eb226335fed4b9c95e9:USD",
    "59144:0xb5bedd42000b71fdde22d3ee8a79bd49a568fc8f:USD",
    "8453:0x63706e401c06ac8513145b7687a14804d17f814b:USD",
    "8453:0x88fb150bdc53a65fe94dea0c9ba0a6daf8c6e196:USD",
    "8453:0x9e1028f5f1d5ede59748ffcee5532509976840e0:USD",
    "9745:0x76a443768a5e3b8d1aed0105fc250877841deb40:USD",
    "9745:0x9895d81bb462a195b4922ed7de0e3acd007c32cb:USD",
    "9745:0xa3d68b74bf0528fdd07263c60d6488749044914b:USD",
  ]);
  expect(
    policy.approvals
      .filter(({ sourceCategorySuitability }) => sourceCategorySuitability)
      .map(approvalKey),
  ).toEqual(["100:0x9c58bacc331c9aa871afd802db6379a98e80cedb:USD"]);
  for (const approval of policy.approvals.filter(
    ({ boundedPriceSuitability }) => boundedPriceSuitability,
  ))
    expect(approval.tokenAddress).toBe(
      USD_TOKENS[
        approval.chainId as keyof typeof USD_TOKENS
      ].address.toLowerCase(),
    );
});

it("preserves Sepolia's separate WETH-only test route", () => {
  expect(
    getSupportedTokens(11155111).sellTokens.map(({ token }) =>
      token.address.toLowerCase(),
    ),
  ).toEqual(["0xfff9976782d46cc05630d1f6ebab18b2324d6b14"]);
});

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
