/** @jest-environment jsdom */

let mockUseRealSupportedTokens = false;

// Opt in to simulated TEST approvals; production policy remains unchanged.
jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      mockUseRealSupportedTokens
        ? actual.getSupportedTokens(chainId)
        : (TEST_SUPPORTED_TOKENS[chainId] ??
          actual.getSupportedTokens(chainId)),
  };
});

import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

import {
  configuredTokenOracle,
  fetchOraclePairPrice,
  fetchOracleUsdPrice,
} from "#/lib/oraclePrice";
import { configuredTokenRoute } from "#/lib/oracleRouter";
import { publicClientsFromIds } from "#/lib/publicClients";
import { findKnownToken, getSupportedTokens } from "#/lib/supportedTokens";

import { useAdvancedSettingsStore } from "../useAdvancedSettings";
import { useOraclePrice } from "../useOraclePrice";
import { useTokenPairPrice } from "../useTokenPairPrice";
import { useTokenPrice } from "../useTokenPrice";

jest.mock("wagmi", () => ({ useAccount: () => ({ chainId: 1 }) }));

jest.mock("#/lib/oraclePrice", () => ({
  ...jest.requireActual("#/lib/oraclePrice"),
  fetchOracleUsdPrice: jest.fn(),
  fetchOraclePairPrice: jest.fn(),
}));

const oracle = "0x1111111111111111111111111111111111111111";
const fetchPrice = jest.mocked(fetchOracleUsdPrice);

function wrapper({ children }: PropsWithChildren) {
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false,
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 0,
      }}
    >
      {children}
    </SWRConfig>
  );
}

beforeEach(() => {
  mockUseRealSupportedTokens = false;
  fetchPrice.mockReset();
  jest.mocked(fetchOraclePairPrice).mockReset();
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

it("does not request a price without a feed", () => {
  const { result } = renderHook(() => useOraclePrice(1), { wrapper });
  expect(result.current.data).toBeUndefined();
  expect(fetchPrice).not.toHaveBeenCalled();
});

it("hides the cached price after a failed refresh and recovers", async () => {
  fetchPrice.mockResolvedValueOnce(2000);
  const { result } = renderHook(() => useOraclePrice(1, oracle), { wrapper });
  await waitFor(() => expect(result.current.data).toBe(2000));

  fetchPrice.mockRejectedValueOnce(new Error("Required price feed is stale"));
  await act(async () => {
    await result.current.mutate();
  });
  expect(result.current.error).toBeDefined();
  expect(result.current.data).toBeUndefined();

  fetchPrice.mockResolvedValueOnce(2100);
  await act(async () => {
    await result.current.mutate();
  });
  expect(result.current.error).toBeUndefined();
  expect(result.current.data).toBe(2100);
});

it("retries an initial RPC failure despite the root retry setting", async () => {
  jest.useFakeTimers();
  fetchPrice
    .mockRejectedValueOnce(new Error("RPC unavailable"))
    .mockResolvedValue(2000);
  const { result } = renderHook(() => useOraclePrice(1, oracle, 3600), {
    wrapper,
  });
  await act(async () => {});
  expect(result.current.error).toBeDefined();

  await act(async () => {
    await jest.advanceTimersByTimeAsync(90_000);
  });
  expect(result.current.data).toBe(2000);
  expect(result.current.error).toBeUndefined();
  expect(fetchPrice).toHaveBeenCalledWith({ chainId: 1, oracle, maxAge: 3600 });
});

it("uses the canonical ETH route for pair prices and direct USD for estimates", async () => {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const sell = sellTokens.find(({ oracles }) => oracles.ETH && oracles.USD)!;
  const pairPrice = jest.mocked(fetchOraclePairPrice).mockResolvedValue(20);
  fetchPrice.mockResolvedValue(21);
  const { result } = renderHook(
    () => ({
      pair: useTokenPairPrice(sell.token, buyToken.token, 1),
      usd: useTokenPrice(sell.token, 1),
    }),
    { wrapper },
  );
  await waitFor(() => expect(result.current.pair.data).toBe(20));
  expect(pairPrice).toHaveBeenCalledWith({
    chainId: 1,
    route: configuredTokenRoute({
      chainId: 1,
      tokenSell: sell.token,
      tokenBuy: buyToken.token,
    }),
    maxAge: expect.any(Number),
    sellMaxAge: expect.any(Number),
    buyMaxAge: expect.any(Number),
  });
  expect(configuredTokenOracle(sell.token.address, 1)).toBe(sell.oracles.USD);
  expect(fetchPrice).toHaveBeenCalledWith(
    expect.objectContaining({ oracle: sell.oracles.USD }),
  );
});

it("leaves USD estimates unavailable for ETH-only tokens", () => {
  const { sellTokens } = getSupportedTokens(1);
  const sell = sellTokens.find(({ oracles }) => oracles.ETH && !oracles.USD)!;
  const { result } = renderHook(() => useTokenPrice(sell.token, 1), {
    wrapper,
  });
  expect(result.current.data).toBeUndefined();
  expect(fetchPrice).not.toHaveBeenCalled();
});

it.each(["fresh", "stale sell", "stale buy", "user limit"])(
  "applies real Ethereum feed limits through the pair-price hook: %s",
  async (scenario) => {
    mockUseRealSupportedTokens = true;
    const actual =
      jest.requireActual<typeof import("#/lib/oraclePrice")>(
        "#/lib/oraclePrice",
      );
    const pairPrice = jest
      .mocked(fetchOraclePairPrice)
      .mockImplementation(actual.fetchOraclePairPrice);
    const { sellTokens, buyToken } = getSupportedTokens(1);
    const sell = sellTokens.find(({ token }) => token.symbol === "WETH")!;
    const sellCeiling = sell.oracleApprovals!.USD!.maxAgeSeconds;
    const buyCeiling = buyToken.oracleApprovals!.USD!.maxAgeSeconds;
    const sellAge = scenario === "stale sell" ? sellCeiling + 1 : 1000;
    const buyAge = scenario === "stale buy" ? buyCeiling + 1 : 60000;
    const original = useAdvancedSettingsStore.getState().advancedSettings;
    const maxAge = scenario === "user limit" ? 3600 : 86400;
    useAdvancedSettingsStore.getState().setAdvancedSettings({
      ...original,
      maxHoursSinceOracleUpdates: maxAge / 3600,
    });
    const client = publicClientsFromIds[1];
    jest.spyOn(client, "getBlock").mockResolvedValue({
      number: BigInt(10),
      timestamp: BigInt(200000),
    } as never);
    jest
      .spyOn(client, "readContract")
      .mockImplementation(async ({ functionName, address }) => {
        if (functionName === "decimals") return 8;
        const selling =
          address?.toLowerCase() === sell.oracles.USD!.toLowerCase();
        return [
          BigInt(1),
          BigInt(selling ? 200000000000 : 100000000),
          BigInt(200000 - (selling ? sellAge : buyAge)),
          BigInt(200000 - (selling ? sellAge : buyAge)),
          BigInt(1),
        ];
      });
    try {
      const { result } = renderHook(
        () => useTokenPairPrice(sell.token, buyToken.token, 1),
        { wrapper },
      );
      if (scenario === "fresh")
        await waitFor(() => expect(result.current.data).toBe(2000));
      else {
        await waitFor(() =>
          expect(result.current.error?.message).toContain("stale"),
        );
        expect(result.current.data).toBeUndefined();
      }
      expect(pairPrice).toHaveBeenCalledWith({
        chainId: 1,
        route: {
          tokenSellOracle: sell.oracles.USD!.toLowerCase(),
          tokenBuyOracle: buyToken.oracles.USD!.toLowerCase(),
        },
        maxAge: Math.min(maxAge, Math.max(sellCeiling, buyCeiling)),
        sellMaxAge: Math.min(maxAge, sellCeiling),
        buyMaxAge: Math.min(maxAge, buyCeiling),
      });
    } finally {
      await act(async () => {
        useAdvancedSettingsStore.getState().setAdvancedSettings(original);
      });
    }
  },
);

it("keeps saved historical pair feeds without enabling their creation route", async () => {
  mockUseRealSupportedTokens = true;
  const tokenSell = findKnownToken(
    100,
    "0x6a023ccd1ff6f2045c3309768ead9e68f978f6e1",
  )!;
  const pairPrice = jest.mocked(fetchOraclePairPrice).mockResolvedValue(2000);
  const saved = {
    tokenSellOracle: "0xa767f745331D267c7751297D982b050c93985627" as const,
    tokenBuyOracle: "0x26C31ac71010aF62E6B486D1132E266D6298857D" as const,
    maxAge: 3600,
  };
  const tokenBuy = {
    address: "0x2a22f9c3b484c3629090feed35f17ff8f88f76f0" as const,
    symbol: "USDC.e",
    decimals: 6,
  };
  const { result } = renderHook(
    () => useTokenPairPrice(tokenSell, tokenBuy, 100, saved),
    { wrapper },
  );
  await waitFor(() => expect(result.current.data).toBe(2000));
  expect(pairPrice).toHaveBeenCalledWith({
    chainId: 100,
    route: {
      tokenSellOracle: saved.tokenSellOracle.toLowerCase(),
      tokenBuyOracle: saved.tokenBuyOracle.toLowerCase(),
    },
    maxAge: 3600,
    sellMaxAge: 3600,
    buyMaxAge: 3600,
  });
  expect(() =>
    configuredTokenRoute({
      chainId: 100,
      tokenSell,
      tokenBuy,
    }),
  ).toThrow(getSupportedTokens(100).unavailableReason);
});
