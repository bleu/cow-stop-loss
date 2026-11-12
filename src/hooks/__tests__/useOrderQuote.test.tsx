/** @jest-environment jsdom */

import { AppDataSdk } from "@cowprotocol/sdk-app-data";
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
  fetchMock.mockReset().mockResolvedValue({
    ok: true,
    json: async () => ({ quote: { buyAmount: "1960000000" } }),
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

function setup(initialProps = input, cache = new Map()) {
  return renderHook(
    (props: Parameters<typeof useOrderQuote>[0]) => useOrderQuote(props),
    {
      initialProps,
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

it("keeps fixed 10% slippage before, during, and after a failed execution quote", async () => {
  let fail!: (error: Error) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise((_, reject) => {
        fail = reject;
      }),
  );
  const { result, rerender } = setup();
  expect(result.current).toEqual({
    slippagePercent: "10",
    isLoading: false,
    hasInput: false,
    hasQuote: false,
    quoteError: undefined,
  });
  rerender({ ...input, amountSell: "1" });
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.isLoading).toBe(true);
  await advance();
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.isLoading).toBe(true);
  expect(result.current.hasInput).toBe(true);
  expect(result.current.hasQuote).toBe(false);
  const error = new Error("Quote request failed");
  await act(async () => fail(error));
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.isLoading).toBe(false);
  expect(result.current.hasQuote).toBe(false);
  expect(result.current.quoteError).toBe(error);
});

it("keeps the current quote when an oracle refresh fails", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.hasQuote).toBe(true);
  rerender({ ...input, amountSell: "1", oraclePrice: undefined });
  await advance();
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(true);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("gets a fresh quote when a debounced input returns to a previous amount", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.hasQuote).toBe(true);
  rerender({ ...input, amountSell: "2" });
  await advance();
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ errorType: "SellAmountDoesNotCoverFee" }),
  });
  rerender({ ...input, amountSell: "1" });
  expect(result.current.hasQuote).toBe(false);
  await advance();
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(result.current.hasQuote).toBe(false);
  expect(result.current.quoteError).toBeDefined();
  expect(result.current.slippagePercent).toBe("10");
});

it("does not apply a late quote to a different sell amount", async () => {
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementation(async (_url: string, options?: RequestInit) => {
    const body = JSON.parse(options!.body as string);
    if (body.sellAmountBeforeFee === "1000000000000000000")
      return new Promise((resolve) => {
        finish = resolve;
      });
    return {
      ok: false,
      json: async () => ({ errorType: "SellAmountDoesNotCoverFee" }),
    };
  });
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  rerender({ ...input, amountSell: "0.5" });
  expect(result.current.hasQuote).toBe(false);
  await advance();
  const error = result.current.quoteError;
  expect(error).toBeDefined();
  await act(async () => {
    finish({
      ok: true,
      json: async () => ({ quote: { buyAmount: "1800000000" } }),
    });
  });
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(false);
  expect(result.current.quoteError).toBe(error);
});

it("does not refresh unchanged inputs on time, focus, reconnect, or oracle updates", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  rerender({ ...input, amountSell: "1", oraclePrice: 1000 });
  await act(async () => {
    window.dispatchEvent(new Event("focus"));
    window.dispatchEvent(new Event("online"));
  });
  await advance(180_000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(true);
});

it.each([
  [
    "SellAmountDoesNotCoverFee",
    "The sell amount does not cover current estimated fees. This order might not execute.",
  ],
  [
    "OtherError",
    "A current execution quote is unavailable. This order might not execute.",
  ],
])("preserves the execution quote error for %s", async (errorType, message) => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ errorType }),
  });
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(result.current.quoteError?.message).toBe(message);
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(false);
  expect(result.current.isLoading).toBe(false);
  await advance(180_000);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

it("quotes the debounced sell budget without a slippage recommendation request", async () => {
  const { result, rerender } = setup();
  rerender({ ...input, amountSell: "1" });
  await advance(499);
  expect(fetchMock).not.toHaveBeenCalled();
  await advance(1);
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(true);
  expect(result.current.isLoading).toBe(false);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  const [url, options] = fetchMock.mock.calls[0];
  expect(url).toMatch(/\/quote$/);
  expect(JSON.parse(options.body)).toEqual({
    kind: "sell",
    sellAmountBeforeFee: "1000000000000000000",
    sellToken: sell.address,
    buyToken: buy.address,
    from: buy.address,
    priceQuality: "fast",
    signingScheme: "eip1271",
    appData: expect.any(String),
  });
  const document = JSON.parse(JSON.parse(options.body).appData);
  await expect(new AppDataSdk().validateAppDataDoc(document)).resolves.toEqual({
    success: true,
  });
  expect(document).toMatchObject({
    version: "1.1.0",
    appCode: "bleu-stop-loss",
    metadata: {
      widget: { appCode: "bleu-stop-loss" },
      partnerFee: {
        bps: 25,
        recipient: "0x5D40015034DA6cD75411c54dd826135f725c2498",
      },
    },
  });
  expect(
    fetchMock.mock.calls.some(([url]) => url.includes("slippageTolerance")),
  ).toBe(false);
});

it("waits for an oracle price before requesting an execution quote", async () => {
  const { result, rerender } = setup({
    ...input,
    amountSell: "1",
    oraclePrice: undefined,
  });
  await advance();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.isLoading).toBe(true);
  expect(result.current.hasQuote).toBe(false);
  rerender({ ...input, amountSell: "1" });
  await advance();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.current.hasQuote).toBe(true);
});

it("does not request a quote while disabled", async () => {
  const { result, rerender } = setup({ ...input, enabled: false });
  rerender({ ...input, enabled: false, amountSell: "1" });
  await advance();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(result.current.slippagePercent).toBe("10");
  expect(result.current.hasQuote).toBe(false);
  rerender({ ...input, enabled: true, amountSell: "1" });
  await advance();
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(result.current.hasQuote).toBe(true);
});

it.each(["", "0", "-1", "1e3", "1.0000000000000000001"])(
  "does not request a quote for invalid sell amount %s",
  async (amountSell) => {
    const { result } = setup({ ...input, amountSell });
    await advance();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.slippagePercent).toBe("10");
    expect(result.current.hasInput).toBe(false);
    expect(result.current.isLoading).toBe(false);
  },
);

it.each(["account", "tokenSell", "tokenBuy"] as const)(
  "waits for %s before requesting an execution quote",
  async (field) => {
    const { result } = setup({ ...input, amountSell: "1", [field]: undefined });
    await advance();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current.hasInput).toBe(false);
    expect(result.current.slippagePercent).toBe("10");
  },
);

it.each(["account", "chainId"] as const)(
  "gets a fresh execution quote when %s changes",
  async (field) => {
    jest
      .spyOn(publicClientsFromIds[100], "readContract")
      .mockResolvedValue(buy.address);
    const { result, rerender } = setup();
    rerender({ ...input, amountSell: "1" });
    await advance();
    const changed = {
      ...input,
      amountSell: "1",
      ...(field === "account"
        ? { account: buy.address }
        : { chainId: 100 as const }),
    };
    rerender(changed);
    expect(result.current.hasQuote).toBe(false);
    await advance();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.hasQuote).toBe(true);
    expect(result.current.slippagePercent).toBe("10");
    if (field === "account") {
      expect(publicClientsFromIds[1].readContract).toHaveBeenLastCalledWith(
        expect.objectContaining({
          functionName: "proxyOf",
          args: [buy.address],
        }),
      );
    } else {
      expect(publicClientsFromIds[100].readContract).toHaveBeenCalled();
      expect(fetchMock.mock.calls[1][0]).not.toBe(fetchMock.mock.calls[0][0]);
    }
  },
);

it("gets a fresh quote for a new hook session with the same cache and input", async () => {
  const cache = new Map();
  const first = setup({ ...input, amountSell: "1" }, cache);
  await advance();
  expect(first.result.current.hasQuote).toBe(true);
  first.unmount();
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ errorType: "SellAmountDoesNotCoverFee" }),
  });
  const second = setup({ ...input, amountSell: "1" }, cache);
  await advance();
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(second.result.current.hasQuote).toBe(false);
  expect(second.result.current.quoteError).toBeDefined();
  expect(second.result.current.slippagePercent).toBe("10");
});
