/** @jest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { SWRConfig } from "swr";

import { fetchOracleUsdPrice } from "#/lib/oraclePrice";

import { useOraclePrice } from "../useOraclePrice";

jest.mock("#/lib/oraclePrice", () => ({
  fetchOracleUsdPrice: jest.fn(),
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
