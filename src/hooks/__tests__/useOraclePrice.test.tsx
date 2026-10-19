/** @jest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

import {
  configuredTokenOracle,
  fetchOraclePairPrice,
  fetchOracleUsdPrice,
} from "#/lib/oraclePrice";
import { configuredTokenRoute } from "#/lib/oracleRouter";
import { getSupportedTokens } from "#/lib/supportedTokens";

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

beforeEach(() => fetchPrice.mockReset());
afterEach(() => jest.useRealTimers());

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

it("keeps saved historical pair feeds without enabling their creation route", async () => {
  const { sellTokens } = getSupportedTokens(100);
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
    () => useTokenPairPrice(sellTokens[0].token, tokenBuy, 100, saved),
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
  });
  expect(() =>
    configuredTokenRoute({
      chainId: 100,
      tokenSell: sellTokens[0].token,
      tokenBuy,
    }),
  ).toThrow("Unsupported buy token");
});
