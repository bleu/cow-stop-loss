import type { PublicClient } from "viem";

import { useAdvancedSettingsStore } from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";

import { POLLER_ADDRESS_BY_CHAIN_ID } from "../contracts";
import * as appData from "../cowApi/uploadAppData";
import { fetchOracleUsdPrice } from "../oraclePrice";
import {
  configuredRouteMaxAgeSeconds,
  ConfiguredRouter,
  configuredTokenRoute,
} from "../oracleRouter";
import {
  assertPlacementRoute,
  buildPlacementApproval,
  buildPlacementSetup,
  type PreparedPlacement,
  preparePlacement,
  refreshPlacementChecks,
} from "../pollerStopLoss";
import { publicClientsFromIds } from "../publicClients";
import { generateAdvancedSettingsSchema, VALID_TO_OPTIONS } from "../schema";
import { encodeStopLossStaticInput } from "../staticInputEncoder";
import * as supported from "../supportedTokens";
import * as catalog from "../tokenCatalog";
import { DraftOrder, OrderStatus } from "../types";

const account = "0x1111111111111111111111111111111111111111";
const appDataHash = `0x${"00".repeat(32)}` as const;
const testChain = 11155111;

function sepoliaDraft(): DraftOrder {
  const { sellTokens, buyToken } = supported.getSupportedTokens(testChain);
  const pair = {
    chainId: testChain as typeof testChain,
    tokenSell: sellTokens[0].token,
    tokenBuy: buyToken.token,
  };
  return {
    id: "policy-test",
    ...pair,
    ...configuredTokenRoute(pair),
    amountSell: "1",
    amountBuy: "1980",
    strikePrice: "2000",
    limitPrice: "1980",
    slippagePercent: "1",
    isSellOrder: true,
    receiver: account,
    partiallyFillable: true,
    maxHoursSinceOracleUpdates: 1,
    validTo: 2000000000,
    salt: `0x${"ab".repeat(32)}`,
    oraclePrice: 2000,
    status: OrderStatus.DRAFT,
  };
}

function prepared(
  draft: DraftOrder,
  chainId: 1 | typeof testChain,
): PreparedPlacement {
  return {
    account,
    chainId,
    draft,
    staticInput: encodeStopLossStaticInput(draft, appDataHash),
    factory: account,
    owner: account,
    poller: POLLER_ADDRESS_BY_CHAIN_ID[chainId],
    scheduleId: appDataHash,
    appDataHash,
    fullAppData: "{}",
    paramsHash: appDataHash,
    orderDigest: appDataHash,
    domainSeparator: appDataHash,
  };
}

function swapData(draft: DraftOrder) {
  return { ...draft, validTo: VALID_TO_OPTIONS.DAY };
}

afterEach(() => jest.restoreAllMocks());

describe("real creation admission policy", () => {
  it("rejects saved production placements before reads, publication, approvals, or setup", async () => {
    const tokenSell = supported.findKnownToken(
      1,
      "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    )!;
    const draft = {
      ...sepoliaDraft(),
      tokenSell,
      tokenBuy: supported.getSupportedTokens(1).buyToken.token,
    };
    const saved = prepared(draft, 1);
    const reason = supported.getSupportedTokens(1).unavailableReason!;
    const readContract = jest.fn();
    const client = { readContract } as unknown as PublicClient;
    const publish = jest.spyOn(appData, "uploadAppData");
    await expect(
      preparePlacement({ account, chainId: 1, draft, client }),
    ).rejects.toThrow(reason);
    await expect(
      useDraftOrder.getState().createDraftOrder(swapData(draft), 1, account),
    ).rejects.toThrow(reason);
    await expect(refreshPlacementChecks(saved, { client })).resolves.toEqual({
      status: "unknown",
      error: reason,
    });
    const checks = {
      status: "unknown",
      error: "must not reach funding checks",
    } as const;
    await expect(buildPlacementApproval(saved, { checks })).rejects.toThrow(
      reason,
    );
    await expect(
      buildPlacementSetup(saved, { checks, client }),
    ).rejects.toThrow(reason);
    expect(publish).not.toHaveBeenCalled();
    expect(readContract).not.toHaveBeenCalled();
    expect(tokenSell.symbol).toBe("WETH");
  });

  it("keeps historical approval repair separate from creation admission", async () => {
    const historical = prepared(
      {
        ...sepoliaDraft(),
        tokenSell: supported.findKnownToken(
          1,
          "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
        )!,
        tokenBuy: supported.getSupportedTokens(1).buyToken.token,
        maxHoursSinceOracleUpdates: 365 * 24,
      },
      1,
    );
    const repair = { ...historical, kind: "repair" as const };
    await expect(
      buildPlacementApproval(repair, {
        checks: {
          status: "unknown",
          error: "Historical funding check is still required",
        },
      }),
    ).rejects.toThrow("Historical funding check is still required");
    expect(() => assertPlacementRoute(historical.draft, 1)).toThrow(
      supported.getSupportedTokens(1).unavailableReason,
    );
  });

  it("keeps the fixed Sepolia route and rejects saved or encoded excessive ages", () => {
    const draft = sepoliaDraft();
    expect(configuredRouteMaxAgeSeconds({ chainId: testChain, ...draft })).toBe(
      86400,
    );
    expect(() =>
      assertPlacementRoute(
        draft,
        testChain,
        prepared(draft, testChain).staticInput,
      ),
    ).not.toThrow();
    expect(() =>
      assertPlacementRoute(
        { ...draft, maxHoursSinceOracleUpdates: 25 },
        testChain,
      ),
    ).toThrow("Oracle time limit");
    const excessive = encodeStopLossStaticInput(
      { ...draft, maxHoursSinceOracleUpdates: 25 },
      appDataHash,
    );
    expect(() => assertPlacementRoute(draft, testChain, excessive)).toThrow(
      "Oracle time limit",
    );
    const changed = encodeStopLossStaticInput(
      { ...draft, maxHoursSinceOracleUpdates: 2 },
      appDataHash,
    );
    expect(() => assertPlacementRoute(draft, testChain, changed)).toThrow(
      "does not match",
    );
    for (const maxHoursSinceOracleUpdates of [NaN, Infinity, 0, -1])
      expect(() =>
        assertPlacementRoute(
          { ...draft, maxHoursSinceOracleUpdates },
          testChain,
        ),
      ).toThrow("Oracle time limit");
  });
});

describe("approval identity parsing", () => {
  const proxy = "0x2222222222222222222222222222222222222222";
  function approvedToken() {
    return {
      chainId: 1,
      address: account,
      oracles: { USD: proxy },
      oracleApprovals: {
        USD: {
          chainId: 1,
          tokenAddress: account,
          quote: "USD",
          proxyAddress: proxy,
          path: "TEST-only",
          snapshotFingerprint: "TEST-only",
          identityEvidence: "TEST-only",
          representationEvidence: "TEST-only",
          assetRelationship: "exact-asset",
          assetRelationshipReason: "TEST-only",
          methodologyEvidence: "TEST-only",
          sourceEvidence: "TEST-only",
          expectedDescription: "TEST / USD",
          expectedDecimals: 8,
          reviewDate: "2026-10-19",
          maxAgeSeconds: 1800,
        },
      },
    };
  }

  it("requires a complete exact chain/token/quote/proxy approval", () => {
    const token = approvedToken();
    expect(catalog.parseOracleApprovals(token)).toEqual({
      oracles: { USD: proxy },
      oracleApprovals: { USD: { maxAgeSeconds: 1800 } },
    });
    for (const patch of [
      { chainId: 100 },
      { tokenAddress: proxy },
      { quote: "ETH" },
      { proxyAddress: account },
      { maxAgeSeconds: 0 },
      { maxAgeSeconds: Infinity },
      { expectedDecimals: 19 },
      { methodologyEvidence: "" },
      { reviewDate: "" },
    ]) {
      expect(
        catalog.parseOracleApprovals({
          ...token,
          oracleApprovals: { USD: { ...token.oracleApprovals.USD, ...patch } },
        }).oracles,
      ).toEqual({});
    }
    expect(
      catalog.parseOracleApprovals({ ...token, oracleApprovals: undefined })
        .oracles,
    ).toEqual({});
    expect(
      catalog.parseOracleApprovals({ ...token, oracles: { USD: account } })
        .oracles,
    ).toEqual({});
  });
});

describe("TEST-only approved route ceilings", () => {
  function shorterApprovals() {
    const configured = supported.getSupportedTokens(testChain);
    jest
      .spyOn(supported, "getSupportedTokens")
      .mockImplementation((chainId) => {
        if (chainId !== testChain)
          throw new Error("TEST fixture only supports Sepolia");
        return {
          ...configured,
          sellTokens: configured.sellTokens.map((token) => ({
            ...token,
            oracleApprovals: { USD: { maxAgeSeconds: 1800 } },
          })),
          buyToken: {
            ...configured.buyToken,
            oracleApprovals: { USD: { maxAgeSeconds: 900 } },
          },
        };
      });
  }

  it("uses the tighter leg in settings, draft construction, and saved input", async () => {
    shorterApprovals();
    const draft = sepoliaDraft();
    expect(configuredRouteMaxAgeSeconds({ chainId: testChain, ...draft })).toBe(
      900,
    );
    const schema = generateAdvancedSettingsSchema(testChain, draft);
    const settings = {
      receiver: "",
      partiallyFillable: true,
      maxHoursSinceOracleUpdates: 0.25,
    };
    expect((await schema.safeParseAsync(settings)).success).toBe(true);
    expect(
      (
        await schema.safeParseAsync({
          ...settings,
          maxHoursSinceOracleUpdates: 0.5,
        })
      ).success,
    ).toBe(false);
    const original = useAdvancedSettingsStore.getState().advancedSettings;
    useAdvancedSettingsStore
      .getState()
      .setAdvancedSettings({ ...original, maxHoursSinceOracleUpdates: 1 });
    try {
      await expect(
        useDraftOrder
          .getState()
          .createDraftOrder(swapData(draft), testChain, account),
      ).rejects.toThrow("approved route limit");
    } finally {
      useAdvancedSettingsStore.getState().setAdvancedSettings(original);
    }
    expect(() => assertPlacementRoute(draft, testChain)).toThrow(
      "Oracle time limit",
    );
    const shorter = { ...draft, maxHoursSinceOracleUpdates: 0.125 };
    expect(() =>
      assertPlacementRoute(
        shorter,
        testChain,
        prepared(shorter, testChain).staticInput,
      ),
    ).not.toThrow();
  });

  it("caps configured pair and separate direct-USD reads without weakening stale checks", async () => {
    shorterApprovals();
    const draft = sepoliaDraft();
    const client = publicClientsFromIds[testChain];
    jest.spyOn(client, "getBlock").mockResolvedValue({
      number: BigInt(10),
      timestamp: BigInt(10000),
    } as never);
    jest
      .spyOn(client, "readContract")
      .mockImplementation(async ({ functionName }) => {
        if (functionName === "decimals") return 8;
        return [
          BigInt(1),
          BigInt(100000000),
          BigInt(8000),
          BigInt(8000),
          BigInt(1),
        ];
      });
    const router = new ConfiguredRouter({ chainId: testChain, ...draft });
    await expect(
      router.calculatePrice(configuredTokenRoute(router), 86400),
    ).rejects.toThrow("stale");
    await expect(
      fetchOracleUsdPrice({
        chainId: testChain,
        oracle: draft.tokenBuyOracle,
        maxAge: 86400,
      }),
    ).rejects.toThrow("stale");
  });
});

it("requires volatile identity even when every TEST-only oracle route is approved", () => {
  const configured = supported.getSupportedTokens(testChain);
  const buy = catalog.USD_TOKENS[1];
  jest.spyOn(catalog, "catalogUnavailableReason").mockReturnValue(undefined);
  jest
    .spyOn(catalog, "findTokenOracles")
    .mockReturnValue(configured.buyToken.oracles);
  jest
    .spyOn(catalog, "findTokenOracleApprovals")
    .mockReturnValue({ USD: { maxAgeSeconds: 900 } });
  const actual = supported.getSupportedTokens(1);
  const expected = catalog.TOKEN_CATALOG.filter(
    (token) =>
      token.chainId === 1 &&
      token.address !== buy.address &&
      token.assetClass === "volatile",
  );
  expect(actual.sellTokens.map(({ token }) => token.address).sort()).toEqual(
    expected.map(({ address }) => address).sort(),
  );
  expect(actual.sellTokens.length).toBeGreaterThan(0);
  expect(
    actual.sellTokens.every(
      ({ token }) => (token as catalog.CatalogToken).assetClass === "volatile",
    ),
  ).toBe(true);
  expect(
    catalog.TOKEN_CATALOG.some(
      (token) => token.chainId === 1 && token.assetClass === "usd-linked",
    ),
  ).toBe(true);
});
