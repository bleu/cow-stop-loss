/** @jest-environment jsdom */

import { act, renderHook } from "@testing-library/react";
import { SWRConfig } from "swr";

import { publicClientsFromIds } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useOrderQuote } from "../useOrderQuote";

const sell: IToken = {
  symbol: "WETH",
  decimals: 18,
  address: "0x1111111111111111111111111111111111111111",
};
const buy: IToken = {
  symbol: "USDC",
  decimals: 6,
  address: "0x2222222222222222222222222222222222222222",
};
const input: Parameters<typeof useOrderQuote>[0] = {
  chainId: 1,
  tokenSell: sell,
  tokenBuy: buy,
  amountSell: "",
  account: sell.address,
  oraclePrice: 2000,
};
const fetchMock = jest.fn();
const originalFetch = global.fetch;

beforeEach(() => {
  jest.useFakeTimers();
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValue(buy.address);
  global.fetch = fetchMock;
  fetchMock.mockReset().mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.includes("slippageTolerance")
        ? { slippageBps: 50 }
        : { quote: { buyAmount: "1960000000" } },
  }));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

function setup() {
  const cache = new Map();
  return renderHook(
    (props: Parameters<typeof useOrderQuote>[0]) => useOrderQuote(props),
    {
      initialProps: input,
      wrapper: ({ children }) => (
        <SWRConfig value={{ provider: () => cache }}>{children}</SWRConfig>
      ),
    },
  );
}
async function advance(ms = 500) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
}

it("keeps the current input estimate when an oracle refresh fails", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.slippagePercent).toBe("2.5");
  rerender({ ...input, amountSell: "1", oraclePrice: undefined });
  await advance();
  expect(result.current.slippagePercent).toBe("2.5");
});

it("gets a fresh quote when a debounced input returns to a previous amount", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.slippagePercent).toBe("2.5");
  rerender({ ...input, amountSell: "2" });
  await advance();
  fetchMock.mockImplementation(async (url: string) => ({
    ok: true,
    json: async () =>
      url.includes("slippageTolerance")
        ? { slippageBps: 50 }
        : { quote: { buyAmount: "2000000000" } },
  }));
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.slippagePercent).toBe("0.5");
});

it("does not apply a late quote to a different sell amount", async () => {
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementation(async (url: string, options?: RequestInit) => {
    if (url.includes("slippageTolerance"))
      return { ok: true, json: async () => ({ slippageBps: 50 }) };
    const body = JSON.parse(options!.body as string);
    if (body.sellAmountBeforeFee === "1000000000000000000")
      return new Promise((resolve) => {
        finish = resolve;
      });
    return {
      ok: true,
      json: async () => ({ quote: { buyAmount: "1000000000" } }),
    };
  });
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  rerender({ ...input, amountSell: "0.5" });
  expect(result.current.hasQuote).toBe(false);
  await advance();
  expect(result.current.slippagePercent).toBe("0.5");
  await act(async () => {
    finish({
      ok: true,
      json: async () => ({ quote: { buyAmount: "1800000000" } }),
    });
  });
  expect(result.current.slippagePercent).toBe("0.5");
});

it("does not refresh unchanged inputs on time, focus, reconnect, or oracle updates", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  const requests = fetchMock.mock.calls.length;
  rerender({ ...input, amountSell: "1", oraclePrice: 1000 });
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  await advance(180_000);
  expect(fetchMock).toHaveBeenCalledTimes(requests);
  expect(result.current.slippagePercent).toBe("2.5");
});

it("explains a sell amount that does not cover current fees without losing the pair allowance", async () => {
  fetchMock.mockImplementation(async (url: string) => ({
    ok: url.includes("slippageTolerance"),
    json: async () =>
      url.includes("slippageTolerance")
        ? { slippageBps: 50 }
        : { errorType: "SellAmountDoesNotCoverFee" },
  }));
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.quoteError?.message).toBe(
    "The sell amount does not cover current estimated fees. This order might not execute.",
  );
  expect(result.current.slippagePercent).toBe("0.5");
});

it("quotes the debounced sell budget and returns amount-specific Auto slippage", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance(499);
  expect(fetchMock).not.toHaveBeenCalled();
  await advance(1);
  expect(result.current.slippagePercent).toBe("2.5");
  const request = fetchMock.mock.calls.find(([url]) => url.endsWith("/quote"));
  expect(JSON.parse(request![1].body)).toMatchObject({
    kind: "sell",
    sellAmountBeforeFee: "1000000000000000000",
    sellToken: sell.address,
    buyToken: buy.address,
    from: buy.address,
    priceQuality: "fast",
    signingScheme: "eip1271",
  });
});
