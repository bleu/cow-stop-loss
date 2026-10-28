/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

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

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Address, ReadContractParameters } from "viem";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useOrderSizeLimit } from "#/hooks/useOrderSizeLimit";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import {
  assertOrderSizeLimit,
  ORDER_SIZE_LIMIT_EXCEEDED_ERROR,
  ORDER_SIZE_PRICE_UNAVAILABLE_ERROR,
} from "#/lib/orderSizeLimit";
import { invalidatePlacementReads } from "#/lib/placementReads";
import { publicClientsFromIds, supportedChainIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS, VALID_TO_VALUES_MAP } from "#/lib/schema";
import * as supportedTokens from "#/lib/supportedTokens";
import * as catalog from "#/lib/tokenCatalog";
import { createWagmiConfig } from "#/utils/wagmi";

import { SwapForm } from "../swap-card/SwapForm";

jest.mock("#/hooks/useOrderSizeLimit");
jest.mock("#/lib/orderSizeLimit", () => ({
  ...jest.requireActual("#/lib/orderSizeLimit"),
  assertOrderSizeLimit: jest.fn(),
}));

let safe: { chainId: number; safeAddress: Address } = {
  chainId: 1,
  safeAddress: "0x1111111111111111111111111111111111111111",
};
jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: safe.safeAddress,
    chainId: safe.chainId,
    isConnected: true,
  }),
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
});

const originalFetch = global.fetch;
const fetchMock = jest.fn();

beforeEach(() => {
  jest.mocked(useOrderSizeLimit).mockReset().mockReturnValue("allowed");
  jest.mocked(assertOrderSizeLimit).mockReset().mockResolvedValue(undefined);
  global.fetch = fetchMock;
  fetchMock
    .mockReset()
    .mockImplementation(async (_url: string, options?: RequestInit) => {
      const body = JSON.parse(options!.body as string);
      const sellAmount = BigInt(body.sellAmountBeforeFee);
      const isWeth =
        body.sellToken.toLowerCase() ===
        "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
      const buyAmount = isWeth
        ? (sellAmount * BigInt(2000) + BigInt("999999999999")) /
          BigInt("1000000000000")
        : (sellAmount * BigInt(60000)) / BigInt(100);
      return {
        ok: true,
        json: async () => ({ quote: { buyAmount: buyAmount.toString() } }),
      };
    });
  mockUseRealSupportedTokens = false;
  safe = {
    chainId: 1,
    safeAddress: "0x1111111111111111111111111111111111111111",
  };
  invalidatePlacementReads({ account: safe.safeAddress, chainId: 1 });
  for (const chainId of supportedChainIds) {
    const client = publicClientsFromIds[chainId];
    if (chainId !== 1)
      jest.spyOn(client, "getBlock").mockResolvedValue({
        number: BigInt(1),
        timestamp: BigInt(1),
      } as Awaited<ReturnType<typeof client.getBlock>>);
    jest.spyOn(client, "multicall").mockImplementation(async ({ contracts }) =>
      Promise.all(
        contracts.map(async (contract) => {
          try {
            return {
              status: "success" as const,
              result: await client.readContract(
                contract as ReadContractParameters,
              ),
            };
          } catch (error) {
            return { status: "failure" as const, error };
          }
        }),
      ),
    );
  }
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(1));
  useDraftOrder.getState().setCurrentDraftOrder(undefined);
  useAdvancedSettingsStore.getState().resetAdvancedSettings();
  jest.spyOn(publicClientsFromIds[1], "getBlock").mockResolvedValue({
    number: BigInt(1),
    timestamp: BigInt(1),
  } as Awaited<ReturnType<(typeof publicClientsFromIds)[1]["getBlock"]>>);
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "COW_SHED_FACTORY" || functionName === "proxyOf")
        return safe.safeAddress;
      if (functionName === "balanceOf") return BigInt("1123456789012345678");
      if (functionName === "domainSeparator") return `0x${"1".repeat(64)}`;
      if (functionName === "domainVerifiers") return COMPOSABLE_COW_ADDRESS;
      if (functionName === "decimals") return 8;
      return [
        BigInt(1),
        address?.toLowerCase() === "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
          ? BigInt("200000000000")
          : address?.toLowerCase() ===
              "0x2665701293fcbeb223d11a08d826563edcce423a"
            ? BigInt("6000000000000")
            : BigInt("100000000"),
        BigInt(1),
        BigInt(1),
        BigInt(1),
      ];
    });
});
afterEach(() => {
  jest.restoreAllMocks();
  global.fetch = originalFetch;
});

it.each([
  ["checking", "Checking order size..."],
  ["over", "Order exceeds $10,000 limit"],
  ["unavailable", "USD price unavailable"],
] as const)(
  "blocks review when the order size check is %s",
  async (status, message) => {
    jest.mocked(useOrderSizeLimit).mockReturnValue(status);
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    renderForm(onReviewOrder);
    await selectWeth(user);
    await setTriggerPrice(user);
    await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
    const review = await screen.findByRole("button", { name: message });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText(/Maximum order size:/)).not.toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(review).toBeDisabled();
    fireEvent.submit(review.closest("form")!);
    await act(async () => {});
    expect(assertOrderSizeLimit).not.toHaveBeenCalled();
    expect(onReviewOrder).not.toHaveBeenCalled();
  },
);

it.each([ORDER_SIZE_LIMIT_EXCEEDED_ERROR, ORDER_SIZE_PRICE_UNAVAILABLE_ERROR])(
  "checks the submitted sell amount again and blocks review: %s",
  async (message) => {
    jest.mocked(assertOrderSizeLimit).mockRejectedValue(new Error(message));
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    renderForm(onReviewOrder);
    await selectWeth(user);
    await setTriggerPrice(user);
    await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
    await user.click(await findReadyReviewButton());
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(assertOrderSizeLimit).toHaveBeenCalledWith({
      chainId: 1,
      tokenSell: expect.objectContaining({ symbol: "WETH", decimals: 18 }),
      sellAmount: BigInt("1000000000000000000"),
    });
    expect(onReviewOrder).not.toHaveBeenCalled();
    expect(useDraftOrder.getState().currentDraftOrder).toBeUndefined();
  },
);

it.each([
  "Sell amount",
  "Trigger price",
  "Limit price",
  "Slippage tolerance (%)",
])("limits %s to digits and one decimal point", async (name) => {
  const user = userEvent.setup();
  renderForm();
  if (name === "Slippage tolerance (%)")
    await switchLimitView(user, "Slippage");
  const input = screen.getByRole("textbox", { name });
  await user.clear(input);
  await user.type(input, ".");
  expect(input).toHaveValue(".");
  await user.type(input, "5");
  expect(input).toHaveValue(".5");
  await user.clear(input);
  await user.type(input, "1.25");
  await user.type(input, "abcEe+-., ");
  expect(input).toHaveValue("1.25");

  for (const value of ["abc", "1e3", "-2", "+2", "1.2.3", "1,000", " 2 "]) {
    await user.paste(value);
    expect(input).toHaveValue("1.25");
  }

  await user.clear(input);
  await user.paste("0.123456789012345678");
  expect(input).toHaveValue("0.123456789012345678");
  await user.clear(input);
  expect(input).toHaveValue("");
});

it("allows percentage mode without a sell token or amount and preserves the trigger when switching back", async () => {
  const user = userEvent.setup();
  renderForm();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("");
  expect(screen.getByRole("button", { name: "Select token" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Select token" })).toHaveClass(
    "rescue-square-control",
  );
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  await user.type(trigger, "1800.123456789012345678");
  const percentMode = screen.getByRole("button", { name: "% drop" });
  expect(percentMode).toBeEnabled();
  await user.click(percentMode);
  expect(percentMode).toHaveAttribute("aria-pressed", "true");
  expect(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
  ).toBeDisabled();
  await user.click(
    within(percentMode.closest("section")!).getByRole("button", {
      name: "Price",
    }),
  );
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "1800.123456789012345678",
  );
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("");
  expect(
    screen.queryByRole("button", {
      name: /Set trigger to current market price/,
    }),
  ).not.toBeInTheDocument();
});

it("does not show order size text below the sell amount", () => {
  renderForm();
  expect(screen.queryByText(/Maximum order size:/)).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps the default 10% limit when the execution quote fails", async () => {
  fetchMock.mockRejectedValue(new Error("Quote unavailable"));
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(
    await screen.findByText(
      "A current execution quote is unavailable. This order might not execute.",
    ),
  ).toBeVisible();
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "1800",
  );
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "1800");
  await switchLimitView(user, "Slippage");
  expect(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  ).toHaveValue("10");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ slippagePercent: "10", amountBuy: "1800" }),
      1,
      safe.safeAddress,
    ),
  );
});

it("keeps the default limit while an execution quote is pending", async () => {
  let finish!: (value: unknown) => void;
  fetchMock.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await waitFor(() => expect(finish).toBeDefined());
  const review = screen.getByRole("button", { name: "Review Stop Loss order" });
  expect(review).toBeDisabled();
  await user.click(review);
  expect(onReviewOrder).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "1800",
  );
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "1800");
  expect(
    screen.queryByText(/Checking the current execution estimate/),
  ).not.toBeInTheDocument();
  await act(async () => {
    finish({
      ok: true,
      json: async () => ({ quote: { buyAmount: "1800000000" } }),
    });
  });
  await user.click(await findReadyReviewButton());
  await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
  expect(onReviewOrder.mock.calls[0][0]).toMatchObject({
    slippagePercent: "10",
    amountBuy: "1800",
  });
});

it("preserves the oracle-age warning without a slippage risk warning", async () => {
  useAdvancedSettingsStore.getState().setAdvancedSettings({
    ...defaultAdvancedSettings,
    maxHoursSinceOracleUpdates: 25,
  });
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(await screen.findByRole("note")).toHaveTextContent(
    "The order accepts oracle prices older than 24 hours.",
  );
  expect(screen.getAllByRole("note")).toHaveLength(1);
  expect(
    screen.queryByText(/Price slippage is above 1%/),
  ).not.toBeInTheDocument();
});

it("keeps the default 10% without recommendation requests or suggestion warnings", async () => {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ quote: { buyAmount: "1000000000" } }),
  });
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  await findReadyReviewButton();
  expect(
    fetchMock.mock.calls.every(
      ([url]) => !String(url).includes("slippageTolerance"),
    ),
  ).toBe(true);
  expect(
    screen.queryByText(
      /fallback|suggested slippage|10% maximum|pair recommendation|Auto slippage/i,
    ),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByText(/Price slippage is above 1%/),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("note")).not.toBeInTheDocument();
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "1800");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ slippagePercent: "10", amountBuy: "1800" }),
      1,
      safe.safeAddress,
    ),
  );
});

it("warns about an amount below current fees but still lets the user review", async () => {
  fetchMock.mockResolvedValue({
    ok: false,
    json: async () => ({ errorType: "SellAmountDoesNotCoverFee" }),
  });
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(
    await screen.findByText(
      "The sell amount does not cover current estimated fees. This order might not execute.",
    ),
  ).toBeVisible();
  const review = screen.getByRole("button", { name: "Review Stop Loss order" });
  expect(review).toBeEnabled();
  await user.click(review);
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ slippagePercent: "10", amountBuy: "1800" }),
      1,
      safe.safeAddress,
    ),
  );
});

it.each(supportedChainIds)(
  "offers the real approved sell tokens on chain %s without an unavailable alert",
  async (chainId) => {
    mockUseRealSupportedTokens = true;
    safe = { ...safe, chainId };
    if (chainId !== 1)
      jest
        .spyOn(publicClientsFromIds[chainId], "readContract")
        .mockResolvedValue(BigInt(0));
    const { sellTokens, buyToken } =
      supportedTokens.getSupportedTokens(chainId);
    expect(sellTokens.length).toBeGreaterThan(0);
    const user = userEvent.setup();
    renderForm();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: `${buyToken.token.symbol} token` }),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Select token" }));
    expect(screen.getAllByRole("option")).toHaveLength(sellTokens.length);
    for (const { token } of sellTokens)
      expect(
        screen.getByRole("option", {
          name: new RegExp(`^Token Logo ${token.symbol}\\b`),
        }),
      ).toBeInTheDocument();
  },
);

it.each([
  ["AAVE", "0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9"],
  ["COMP", "0xc00e94cb662c3520282e6f5717214004a7f26888"],
])(
  "finds the approved %s contract by address and reviews its route",
  async (symbol, address) => {
    mockUseRealSupportedTokens = true;
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    renderForm(onReviewOrder);
    await user.click(screen.getByRole("button", { name: "Select token" }));
    expect(
      screen.queryByRole("option", { name: /^Token Logo USDC\b/ }),
    ).not.toBeInTheDocument();
    await user.type(
      screen.getByPlaceholderText("Search supported tokens"),
      address,
    );
    expect(screen.getAllByRole("option")).toHaveLength(1);
    await user.click(
      screen.getByRole("option", {
        name: new RegExp(`^Token Logo ${symbol}\\b`),
      }),
    );
    await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
    await user.type(
      screen.getByRole("textbox", { name: "Trigger price" }),
      "0.95",
    );
    await user.click(await findReadyReviewButton());
    await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
    expect(onReviewOrder.mock.calls[0][0]).toMatchObject({
      tokenSell: { symbol, address },
      tokenBuy: {
        symbol: "USDC",
        address: "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      },
    });
  },
);

it.each([
  [42161, "WETH", 2692],
  [42161, "ARB", 86400],
  [42161, "WBTC", 86400],
  [8453, "WETH", 86400],
  [43114, "JOE", 86400],
  [137, "WPOL", 100],
  [56, "WBNB", 1410],
  [56, "Cake", 1410],
] as const)(
  "resets to a valid automatic oracle age and reviews %s %s",
  async (chainId, symbol, expectedAgeSeconds) => {
    mockUseRealSupportedTokens = true;
    safe = { ...safe, chainId };
    invalidatePlacementReads({ account: safe.safeAddress, chainId });
    const client = publicClientsFromIds[chainId];
    jest.spyOn(client, "getBlockNumber").mockResolvedValue(BigInt(10));
    jest.spyOn(client, "getBlock").mockResolvedValue({
      number: BigInt(10),
      timestamp: BigInt(200000),
    } as never);
    jest
      .spyOn(client, "readContract")
      .mockImplementation(async ({ functionName }) => {
        if (functionName === "balanceOf")
          return BigInt("100000000000000000000");
        if (functionName === "decimals") return 8;
        return [
          BigInt(1),
          BigInt(100000000),
          BigInt(199998),
          BigInt(199998),
          BigInt(1),
        ];
      });
    useAdvancedSettingsStore.getState().setAdvancedSettings({
      ...defaultAdvancedSettings,
      maxHoursSinceOracleUpdates: 1 / 3600,
    });
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    renderForm(onReviewOrder);
    await user.click(screen.getByRole("button", { name: "Select token" }));
    await user.click(
      screen.getByRole("option", {
        name: new RegExp(`^Token Logo ${symbol}\\b`),
      }),
    );
    await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
    await user.type(
      screen.getByRole("textbox", { name: "Trigger price" }),
      "0.95",
    );
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(1 / 3600);
    await user.click(
      screen.getByRole("button", { name: "Reset to default settings" }),
    );
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    const oracleAge = screen.getByRole("spinbutton");
    expect(oracleAge).toHaveValue(expectedAgeSeconds / 3600);
    expect(oracleAge).toHaveAttribute("step", "any");
    expect((oracleAge as HTMLInputElement).checkValidity()).toBe(true);
    await user.click(screen.getByRole("button", { name: "Return to order" }));
    await user.click(await findReadyReviewButton());
    await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
    expect(
      onReviewOrder.mock.calls[0][0].maxHoursSinceOracleUpdates * 3600,
    ).toBe(expectedAgeSeconds);
    expect(useAdvancedSettingsStore.getState().oracleAgeMode).toBe("automatic");
  },
);

it.each(["account", "chain"] as const)(
  "restores automatic route defaults when the %s changes",
  async (scope) => {
    mockUseRealSupportedTokens = true;
    safe = { ...safe, chainId: 137 };
    jest
      .spyOn(publicClientsFromIds[137], "readContract")
      .mockResolvedValue(BigInt(0));
    jest
      .spyOn(publicClientsFromIds[42161], "readContract")
      .mockResolvedValue(BigInt(0));
    useAdvancedSettingsStore.getState().setAdvancedSettings({
      ...defaultAdvancedSettings,
      maxHoursSinceOracleUpdates: 0.01,
    });
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    const { rerender } = renderForm(onReviewOrder);
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(0.01);
    safe =
      scope === "account"
        ? { ...safe, safeAddress: "0x2222222222222222222222222222222222222222" }
        : { ...safe, chainId: 42161 };
    rerender(
      <SWRConfig
        value={{ provider: () => new Map(), revalidateOnFocus: false }}
      >
        <SwapForm onReviewOrder={onReviewOrder} />
      </SWRConfig>,
    );
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(
      (scope === "account" ? 100 : 86400) / 3600,
    );
    expect(useAdvancedSettingsStore.getState().oracleAgeMode).toBe("automatic");
  },
);

it("shows the unavailable policy reason and keeps submission disabled", async () => {
  mockUseRealSupportedTokens = true;
  const unavailableReason =
    "TEST-only: network execution review is incomplete.";
  jest
    .spyOn(catalog, "catalogUnavailableReason")
    .mockReturnValue(unavailableReason);
  safe = { ...safe, chainId: 100 };
  jest
    .spyOn(publicClientsFromIds[100], "readContract")
    .mockResolvedValue(BigInt(0));
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  expect(screen.getByRole("alert")).toHaveTextContent(unavailableReason);
  expect(screen.queryByText(/Select Ethereum/)).not.toBeInTheDocument();
  const submit = screen.getByRole("button", { name: "Select tokens" });
  expect(submit).toBeDisabled();
  await user.click(submit);
  expect(onReviewOrder).not.toHaveBeenCalled();
});

it("keeps the inactive order pane mounted and inaccessible while settings are open", async () => {
  const user = userEvent.setup();
  renderForm();
  const heading = screen.getByRole("heading", {
    level: 2,
    name: "New Parachute · Define your order",
  });
  expect(heading).toHaveAttribute("id", "place-order-title");
  expect(heading).toHaveClass("rescue-card-title", "text-secondary");
  expect(heading).not.toHaveClass("rescue-display-eyebrow");
  expect(heading).not.toHaveClass("rescue-eyebrow");
  expect(
    screen.queryByRole("heading", { name: "Place a stop-loss order" }),
  ).not.toBeInTheDocument();
  const settings = screen.getByRole("button", { name: "Order settings" });
  const header = heading.closest(".rescue-settings-heading");
  expect(header).toContainElement(settings);
  expect(header).toHaveClass("min-h-11", "lg:min-h-7", "items-center");
  expect(settings).toHaveClass(
    "size-11",
    "min-h-11",
    "min-w-11",
    "lg:size-7",
    "lg:min-h-7",
    "lg:min-w-7",
  );
  expect(header).not.toHaveClass("items-start");
  const sellAmount = screen.getByRole("textbox", { name: "Sell amount" });
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  const limitPrice = screen.getByRole("textbox", { name: "Limit price" });
  await user.type(sellAmount, "1.25");
  const pane = sellAmount.closest("[data-inactive]");
  expect(pane).toHaveAttribute("aria-hidden", "false");
  expect(pane).toHaveAttribute("data-inactive", "false");
  expect(pane).not.toHaveAttribute("inert");
  expect(pane).not.toHaveAttribute("hidden");

  await user.click(settings);
  expect(pane).toHaveAttribute("aria-hidden", "true");
  expect(pane).toHaveAttribute("inert", "");
  expect(pane).toHaveAttribute("data-inactive", "true");
  expect(pane).not.toHaveAttribute("hidden");
  expect(pane).toContainElement(sellAmount);
  expect(pane).toContainElement(trigger);
  expect(pane).toContainElement(limitPrice);
  expect(sellAmount).toHaveValue("1.25");
  expect(
    screen.queryByRole("textbox", { name: "Limit price" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Sell amount" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Trigger price" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("group", { name: "Advanced order settings" }),
  ).toBeVisible();
  expect(
    screen.getByRole("spinbutton", { name: "Maximum oracle age (hours)" }),
  ).toHaveValue(24);
  expect(screen.getByRole("textbox", { name: "Receiver" })).toHaveAttribute(
    "placeholder",
    "0xabc...123",
  );
  expect(
    screen.queryByRole("textbox", { name: "Sell" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Buy" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review Stop Loss order" }),
  ).not.toBeInTheDocument();

  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() => expect(pane).toHaveAttribute("aria-hidden", "false"));
  expect(pane).toHaveAttribute("data-inactive", "false");
  expect(pane).not.toHaveAttribute("inert");
  expect(pane).not.toHaveAttribute("hidden");
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toBe(sellAmount);
  expect(sellAmount).toHaveValue("1.25");
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toBe(trigger);
  expect(screen.getByRole("textbox", { name: "Limit price" })).toBe(limitPrice);
});

it("shows four accessible settings in uniform rows with only an undecorated Order timing fieldset", async () => {
  const user = userEvent.setup();
  renderForm();
  await user.click(screen.getByRole("button", { name: "Order settings" }));

  const panel = screen.getByRole("region", { name: "Order settings" });
  const settings = within(panel);
  const timing = settings.getByRole("group", { name: "Order timing" });
  const advanced = settings.getByRole("group", {
    name: "Advanced order settings",
  });
  expect(panel.querySelectorAll("fieldset")).toHaveLength(1);
  expect(timing.tagName).toBe("FIELDSET");
  expect(timing).toHaveAttribute("class", "min-w-0");
  expect(panel.querySelectorAll("legend")).toHaveLength(1);
  expect(timing.querySelector("legend")).toHaveClass("sr-only");
  expect(settings.queryByText("Price protection")).not.toBeInTheDocument();
  expect(settings.queryByText("Order handling")).not.toBeInTheDocument();

  const expiry = settings.getByRole("combobox", { name: "Expires" });
  const execution = settings.getByRole("combobox", { name: "Execution" });
  expect(expiry).toHaveClass("rescue-square-control");
  expect(execution).toHaveClass("rescue-square-control");
  const actions = panel.querySelector(".rescue-settings-actions");
  expect(actions).toHaveClass("grid", "grid-cols-1");
  expect(actions).not.toHaveClass("grid-cols-[1fr_1.5fr]");
  expect(actions).not.toHaveClass("sm:grid-cols-[1fr_1.5fr]");
  const fields = [
    expiry,
    settings.getByRole("spinbutton", { name: "Maximum oracle age (hours)" }),
    execution,
    settings.getByRole("textbox", { name: "Receiver" }),
  ];
  expect(timing).toContainElement(expiry);
  const rows = panel.querySelectorAll(".rescue-input-inline");
  expect(rows).toHaveLength(4);
  expect(panel.querySelectorAll(".rescue-input-label")).toHaveLength(4);
  fields.forEach((field, index) => {
    expect(field).toBeVisible();
    expect(field).toBeEnabled();
    expect(field.closest(".rescue-input-inline")).toBe(rows[index]);
    const label = rows[index].querySelector(":scope > .rescue-input-label");
    expect(label?.querySelector("label")).toHaveAttribute("for", field.id);
    if (field !== expiry) expect(advanced).toContainElement(field);
  });
});

function renderForm(onReviewOrder = jest.fn()) {
  const config = createWagmiConfig();
  const queryClient = new QueryClient();
  return render(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm onReviewOrder={onReviewOrder} />
    </SWRConfig>,
    {
      wrapper: ({ children }) => (
        <WagmiProvider config={config} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      ),
    },
  );
}

it("keeps applied form settings in memory without saving browser data", async () => {
  const user = userEvent.setup();
  renderForm();
  const write = jest.spyOn(Storage.prototype, "setItem");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x2222222222222222222222222222222222222222",
  );
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  expect(write).not.toHaveBeenCalledWith(
    "advanced-settings-storage",
    expect.anything(),
  );
});

it("resets percentage entry when the sell token changes", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  await user.type(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
    "10",
  );
  await user.click(screen.getByRole("button", { name: "Token Logo WETH" }));
  await user.click(await screen.findByRole("option", { name: /cbBTC/ }));
  expect(
    within(screen.getByRole("group", { name: "Trigger input mode" })).getByRole(
      "button",
      { name: "Price" },
    ),
  ).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "",
  );
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "");
  expect(
    screen.queryByRole("textbox", { name: "Price drop (%)" }),
  ).not.toBeInTheDocument();
});

it("reviews a price-based draft from a percentage drop and shows the derived minimum received", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  await user.type(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
    "10",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "1620"),
  );
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        strikePrice: "1800",
        amountSell: "1",
        amountBuy: "1620",
        slippagePercent: "10",
      }),
      1,
      safe.safeAddress,
    ),
  );
  expect(onReviewOrder.mock.calls[0][0]).not.toHaveProperty("percent");
});

it("blocks review and clears minimum received after an invalid percentage edit", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.type(input, "10");
  expect(await findReadyReviewButton()).toBeEnabled();
  await user.clear(input);
  await user.type(input, "100");
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", ""),
  );
  const submit = screen.getByRole("button", { name: "Set the trigger price" });
  expect(submit).toBeDisabled();
  await user.click(submit);
  expect(onReviewOrder).not.toHaveBeenCalled();
});

it.each(["wallet", "chain"] as const)(
  "resets percentage state when the %s changes",
  async (scope) => {
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    const { rerender } = renderForm(onReviewOrder);
    await selectWeth(user);
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    });
    await user.click(screen.getByRole("button", { name: "% drop" }));
    await user.type(
      screen.getByRole("textbox", { name: "Price drop (%)" }),
      "10",
    );
    if (scope === "wallet")
      safe = {
        ...safe,
        safeAddress: "0x2222222222222222222222222222222222222222",
      };
    else {
      jest
        .spyOn(publicClientsFromIds[100], "readContract")
        .mockResolvedValue(BigInt(0));
      safe = { ...safe, chainId: 100 };
    }
    rerender(
      <SWRConfig
        value={{ provider: () => new Map(), revalidateOnFocus: false }}
      >
        <SwapForm onReviewOrder={onReviewOrder} />
      </SWRConfig>,
    );
    expect(
      within(
        screen.getByRole("group", { name: "Trigger input mode" }),
      ).getByRole("button", { name: "Price" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
      "",
    );
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "");
    expect(
      screen.queryByRole("textbox", { name: "Price drop (%)" }),
    ).not.toBeInTheDocument();
    expect(onReviewOrder).not.toHaveBeenCalled();
  },
);

it("omits the market amount summary but keeps Market and minimum received", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    }),
  );

  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "1800"),
  );
  expect(screen.queryByText("1 WETH")).not.toBeInTheDocument();
});

it.each(["Price", "Slippage"] as const)(
  "hides limit hints and shows a dimmed receive placeholder without a sell token in the %s view",
  async (view) => {
    const user = userEvent.setup();
    renderForm();
    await switchLimitView(user, view);
    const input = screen.getByRole("textbox", {
      name: view === "Price" ? "Limit price" : "Slippage tolerance (%)",
    });
    expect(input).toBeVisible();
    expect(screen.getByText("Limit price", { exact: true })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Switch to (Price|Slippage)/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Default", { exact: true }),
    ).not.toBeInTheDocument();
    const receive = screen.getByRole("status", { name: "Receive at least" });
    expectUnavailableReceive(receive);
    expect(receive).toHaveAttribute("title", "");
    expect(screen.getByText("Receive at least", { exact: true })).toBeVisible();
    expect(screen.getByRole("img", { name: "USDC token" })).toBeVisible();
    await user.clear(input);
    await user.type(input, view === "Price" ? "94" : "2");
    expect(
      screen.queryByText("Custom", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Switch to (Price|Slippage)/ }),
    ).not.toBeInTheDocument();
    expectUnavailableReceive(receive);
  },
);

it.each(["0", "99.99"])(
  "does not show a slippage risk warning for %s%%",
  async (value) => {
    const { user } = await renderLimitExample();
    await switchLimitView(user, "Slippage");
    const input = screen.getByRole("textbox", {
      name: "Slippage tolerance (%)",
    });
    await user.clear(input);
    await user.type(input, value);
    await findReadyReviewButton();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  },
);

it("keeps trigger and limit typography the same as Sell in both input modes", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  const sell = screen.getByRole("textbox", { name: "Sell amount" });
  const expectSellTypography = (input: HTMLElement) => {
    for (const className of [
      "text-[28px]",
      "font-medium",
      "placeholder:text-muted-foreground/80",
    ]) {
      expect(sell).toHaveClass(className);
      expect(input).toHaveClass(className);
    }
    expect(input).not.toHaveClass("sm:text-[32px]");
  };
  expectSellTypography(screen.getByRole("textbox", { name: "Trigger price" }));
  expectSellTypography(screen.getByRole("textbox", { name: "Limit price" }));
  await user.click(screen.getByRole("button", { name: "% drop" }));
  await switchLimitView(user, "Slippage");
  expectSellTypography(screen.getByRole("textbox", { name: "Price drop (%)" }));
  expectSellTypography(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
});

it("shows limit protection on the order and removes slippage from settings", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  expect(screen.getByRole("textbox", { name: "Limit price" })).toBeVisible();
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  await switchLimitView(user, "Slippage");
  expect(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  ).toHaveValue("10");
  expect(screen.getByText("Limit price", { exact: true })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  const settings = within(
    screen.getByRole("region", { name: "Order settings" }),
  );
  expect(
    settings.queryByRole("textbox", { name: /Slippage/ }),
  ).not.toBeInTheDocument();
  expect(settings.queryByText("Limit price")).not.toBeInTheDocument();
});

function expectUnavailableReceive(receive: HTMLElement) {
  expect(receive).toHaveTextContent(/^0\.0$/);
  expect(receive).toHaveAttribute("title", "");
  expect(receive).toHaveClass(
    "text-muted-foreground",
    "opacity-50",
    "cursor-default",
  );
  expect(receive).toHaveProperty("tagName", "OUTPUT");
  expect(receive).toHaveProperty("tabIndex", -1);
  expect(
    screen.queryByRole("textbox", { name: "Receive at least" }),
  ).not.toBeInTheDocument();
}

async function findReadyReviewButton() {
  const button = await screen.findByRole("button", {
    name: "Review Stop Loss order",
  });
  await waitFor(() => expect(button).toBeEnabled());
  return button;
}

async function selectWeth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
}

async function setTriggerPrice(user: ReturnType<typeof userEvent.setup>) {
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  await user.clear(trigger);
  await user.type(trigger, "2000");
}

async function selectExpiry(
  user: ReturnType<typeof userEvent.setup>,
  expiry: VALID_TO_OPTIONS,
) {
  screen.getByRole("combobox", { name: "Expires" }).focus();
  await user.keyboard("[Space]");
  await user.click(await screen.findByRole("option", { name: expiry }));
}

it("reviews with the one-year expiry without opening settings", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  expect(
    screen.queryByRole("combobox", { name: "Expires" }),
  ).not.toBeInTheDocument();
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const beforeReview = Math.floor(Date.now() / 1000);
  await user.click(await findReadyReviewButton());
  await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
  const duration = VALID_TO_VALUES_MAP[VALID_TO_OPTIONS.YEAR];
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeGreaterThanOrEqual(
    beforeReview + duration,
  );
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeLessThanOrEqual(
    Math.floor(Date.now() / 1000) + duration,
  );
});

it.each([
  [VALID_TO_OPTIONS.MONTHS_3, 90 * 24 * 60 * 60],
  [VALID_TO_OPTIONS.MONTHS_6, 180 * 24 * 60 * 60],
  [VALID_TO_OPTIONS.YEAR, 365 * 24 * 60 * 60],
] as const)("reviews with a selected %s expiry", async (expiry, duration) => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await selectExpiry(user, expiry);
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  const beforeReview = Math.floor(Date.now() / 1000);
  await user.click(await findReadyReviewButton());
  await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeGreaterThanOrEqual(
    beforeReview + duration,
  );
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeLessThanOrEqual(
    Math.floor(Date.now() / 1000) + duration,
  );
});

it("keeps expiry across settings close, reopen, edits and advanced reset", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("group", { name: "Order timing" })).toContainElement(
    screen.getByRole("combobox", { name: "Expires" }),
  );
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.YEAR,
  );
  await selectExpiry(user, VALID_TO_OPTIONS.MINUTES_30);
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.MINUTES_30,
  );
  await selectExpiry(user, VALID_TO_OPTIONS.DAY);
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.DAY,
  );
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.DAY,
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  const beforeReview = Math.floor(Date.now() / 1000);
  await user.click(await findReadyReviewButton());
  await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(1));
  const duration = VALID_TO_VALUES_MAP[VALID_TO_OPTIONS.DAY];
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeGreaterThanOrEqual(
    beforeReview + duration,
  );
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeLessThanOrEqual(
    Math.floor(Date.now() / 1000) + duration,
  );
});

async function allowPartialExecutions(
  user: ReturnType<typeof userEvent.setup>,
) {
  screen.getByRole("combobox", { name: "Execution" }).focus();
  await user.keyboard("[Space]");
  await user.click(
    await screen.findByRole("option", { name: "Allow partial fills" }),
  );
}

it("applies valid slippage edits immediately and reviews the recalculated minimum buy", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(
    screen.getByRole("textbox", { name: "Sell amount" }),
    "0.123456789012345678",
  );

  const minimumBuy = screen.getByRole("status", { name: "Receive at least" });
  await waitFor(() =>
    expect(minimumBuy).toHaveAttribute("title", "222.222221"),
  );
  await switchLimitView(user, "Slippage");
  await user.clear(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
    "0.5",
  );
  await waitFor(() =>
    expect(minimumBuy).toHaveAttribute("title", "245.679011"),
  );
  await waitFor(() =>
    expect(minimumBuy).toHaveAttribute("title", "245.679011"),
  );
  expect(minimumBuy).toHaveProperty("tagName", "OUTPUT");
  expect(onReviewOrder).not.toHaveBeenCalled();

  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSell: "0.123456789012345678",
        amountBuy: "245.679011",
        slippagePercent: "0.5",
      }),
      1,
      safe.safeAddress,
    ),
  );
});

it("keeps invalid slippage visible and blocks review", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await switchLimitView(user, "Slippage");
  const slippage = screen.getByRole("textbox", {
    name: "Slippage tolerance (%)",
  });
  await user.clear(slippage);
  await user.paste("0.001");
  expect(slippage).toHaveValue("0.001");
  expect(slippage).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    within(slippage.closest("section")!).queryByText(
      "Slippage must be between 0% and 99.99% with at most two decimal places",
    ),
  ).not.toBeInTheDocument();
  expectUnavailableReceive(
    screen.getByRole("status", { name: "Receive at least" }),
  );
  const submit = screen.getByRole("button", {
    name: "Slippage must be between 0% and 99.99% with at most two decimal places",
  });
  expect(submit).toBeDisabled();
  fireEvent.submit(slippage.closest("form")!);
  await act(async () => {});
  expect(submit).toBeDisabled();
  expect(onReviewOrder).not.toHaveBeenCalled();
});

it("keeps valid slippage and receiver edits when returning with the settings arrow", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const minimumBuy = screen.getByRole("status", { name: "Receive at least" });
  await switchLimitView(user, "Slippage");
  await user.clear(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
    "0.5",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x2222222222222222222222222222222222222222",
  );
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(minimumBuy).toHaveAttribute("title", "1990"));

  await user.clear(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
    "1",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByPlaceholderText("0xabc...123"));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x3333333333333333333333333333333333333333",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await waitFor(() => expect(minimumBuy).toHaveAttribute("title", "1980"));
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue(
    "0x3333333333333333333333333333333333333333",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        slippagePercent: "1",
        amountBuy: "1980",
        receiver: "0x3333333333333333333333333333333333333333",
      }),
      1,
      safe.safeAddress,
    ),
  );
});

it("advanced reset restores advanced defaults without changing limit protection", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const minimumBuy = screen.getByRole("status", { name: "Receive at least" });
  await switchLimitView(user, "Slippage");
  await user.clear(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
    "1",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x2222222222222222222222222222222222222222",
  );
  const oracleAge = screen.getByRole("spinbutton");
  await user.clear(oracleAge);
  await user.type(oracleAge, "2");
  await allowPartialExecutions(user);
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(minimumBuy).toHaveAttribute("title", "1980"));

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );
  expect(
    screen.queryByRole("group", { name: "Advanced order settings" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: "New Parachute · Define your order" }),
  ).toBeVisible();
  expect(screen.getByRole("status", { name: "Receive at least" })).toBe(
    minimumBuy,
  );
  expect(minimumBuy.closest("[data-inactive]")).not.toHaveAttribute("inert");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(screen.getByRole("combobox", { name: "Execution" })).toHaveTextContent(
    "Fill or kill",
  );
  await waitFor(() => expect(minimumBuy).toHaveAttribute("title", "1980"));
  await user.keyboard("{Escape}");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        slippagePercent: "1",
        amountBuy: "1980",
        receiver: safe.safeAddress,
        maxHoursSinceOracleUpdates: 24,
        partiallyFillable: false,
      }),
      1,
      safe.safeAddress,
    ),
  );
});

it("uses a 24-hour oracle limit in fresh settings and the reviewed draft", async () => {
  localStorage.removeItem("advanced-settings-storage");
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await selectWeth(user);
  await setTriggerPrice(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(await findReadyReviewButton());

  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ maxHoursSinceOracleUpdates: 24 }),
      1,
      safe.safeAddress,
    ),
  );
});

it.each([1, 2.5])(
  "preserves an applied %s-hour oracle limit in settings and review",
  async (maxHoursSinceOracleUpdates) => {
    const user = userEvent.setup();
    const onReviewOrder = jest.fn();
    renderForm(onReviewOrder);
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    await user.clear(screen.getByRole("spinbutton"));
    await user.type(
      screen.getByRole("spinbutton"),
      String(maxHoursSinceOracleUpdates),
    );
    await user.click(screen.getByRole("button", { name: "Return to order" }));
    await waitFor(() =>
      expect(
        screen.queryByRole("group", { name: "Advanced order settings" }),
      ).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    expect(screen.getByRole("spinbutton")).toHaveValue(
      maxHoursSinceOracleUpdates,
    );
    await user.click(screen.getByRole("button", { name: "Order settings" }));
    await selectWeth(user);
    await user.type(
      screen.getByRole("textbox", { name: "Trigger price" }),
      "2000",
    );
    await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
    await user.click(await findReadyReviewButton());

    await waitFor(() =>
      expect(onReviewOrder).toHaveBeenCalledWith(
        expect.objectContaining({ maxHoursSinceOracleUpdates }),
        1,
        safe.safeAddress,
      ),
    );
  },
);

it("does not mark advanced settings as changed after a limit edit", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  const settingsTrigger = screen.getByRole("button", {
    name: "Order settings",
  });
  await switchLimitView(user, "Slippage");
  const slippage = screen.getByRole("textbox", {
    name: "Slippage tolerance (%)",
  });
  await user.clear(slippage);
  await user.type(slippage, "2");
  expect(settingsTrigger).not.toHaveClass("text-primary");
  expect(
    screen.getByRole("button", { name: "Reset to default" }),
  ).toBeVisible();
  await user.click(settingsTrigger);
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );
  expect(slippage).toHaveValue("2");
  expect(
    screen.getByRole("button", { name: "Reset to default" }),
  ).toBeVisible();
  expect(settingsTrigger).not.toHaveClass("text-primary");
});

it("filters the expanded sell catalog by address and resets prices when selection changes", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await setTriggerPrice(user);
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "1800"),
  );

  await user.click(screen.getByRole("button", { name: "Token Logo WETH" }));
  const { sellTokens, buyToken } = supportedTokens.getSupportedTokens(1);
  expect(sellTokens.length).toBeGreaterThan(2);
  expect(screen.getAllByRole("option")).toHaveLength(sellTokens.length);
  expect(
    screen.queryByRole("option", {
      name: new RegExp(`^Token Logo ${buyToken.token.symbol}\\b`),
    }),
  ).not.toBeInTheDocument();
  const cbBtc = sellTokens.find(({ token }) => token.symbol === "cbBTC")!;
  await user.type(
    screen.getByPlaceholderText("Search supported tokens"),
    cbBtc.token.address,
  );
  expect(screen.getAllByRole("option")).toHaveLength(1);
  await user.click(screen.getByRole("option", { name: /cbBTC/ }));

  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "",
  );
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "");
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("1");
  expect(screen.getByRole("img", { name: "USDC token" })).toBeInTheDocument();
  await user.click(
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    }),
  );
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "60000",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "54000"),
  );
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveProperty("tagName", "OUTPUT");
});

it("offers one exact-sell order without buy mode or draft-basket actions", () => {
  renderForm();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toBeEnabled();
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveProperty("tagName", "OUTPUT");
  expect(
    screen.queryByRole("radio", { name: /Toggle/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Add.*order|draft orders/i }),
  ).not.toBeInTheDocument();
});

it.each(["allowed", "over"] as const)(
  "blocks a sell amount one atomic unit above the wallet balance when order size is %s",
  async (status) => {
    jest.mocked(useOrderSizeLimit).mockReturnValue(status);
    const user = userEvent.setup();
    renderForm();
    await selectWeth(user);
    await setTriggerPrice(user);
    await user.type(
      screen.getByRole("textbox", { name: "Sell amount" }),
      "1.123456789012345679",
    );

    expect(
      await screen.findByRole("button", { name: "Insufficient balance" }),
    ).toBeDisabled();
  },
);

it("accepts a trigger at market and rejects one atomic price unit above it", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  await user.type(trigger, "2000");
  expect(await findReadyReviewButton()).toBeEnabled();
  await user.type(trigger, ".000000000000000001");

  expect(
    await screen.findByRole("button", {
      name: "Trigger price must be at or below market price",
    }),
  ).toBeDisabled();
});

it("hands one wallet-scoped exact-sell draft to review and keeps form values for a fresh review", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Sell amount" }),
    "0.123456789012345678",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "222.222221"),
  );
  await user.click(await findReadyReviewButton());

  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSell: "0.123456789012345678",
        amountBuy: "222.222221",
        slippagePercent: "10",
        isSellOrder: true,
        receiver: safe.safeAddress,
      }),
      1,
      safe.safeAddress,
    ),
  );
  expect(
    screen.queryByRole("group", { name: "Advanced order settings" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue(
    "0.123456789012345678",
  );
  const firstDraft = onReviewOrder.mock.calls[0][0];
  await user.click(
    screen.getByRole("button", { name: "Review Stop Loss order" }),
  );
  await waitFor(() => expect(onReviewOrder).toHaveBeenCalledTimes(2));
  expect(onReviewOrder.mock.calls[1][0].salt).not.toBe(firstDraft.salt);
});

it("blocks review when the market price is not positive and available", async () => {
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) => {
    if (args.functionName === "latestRoundData")
      throw new Error("RPC unavailable");
    return read(args);
  });
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(
    await screen.findByRole("button", {
      name: "Market price unavailable. Try again.",
    }),
  ).toBeDisabled();
});

it("resolves a saved custom receiver and preserves expiry, oracle age and partial-fill settings in review", async () => {
  const receiver: Address = "0x2222222222222222222222222222222222222222";
  jest
    .spyOn(publicClientsFromIds[1], "getEnsAddress")
    .mockResolvedValue(receiver);
  useAdvancedSettingsStore.getState().setAdvancedSettings({
    receiver: "receiver.eth",
    maxHoursSinceOracleUpdates: 2,
    partiallyFillable: true,
  });
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await selectExpiry(user, VALID_TO_OPTIONS.MINUTES_30);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  const beforeReview = Math.floor(Date.now() / 1000);
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        receiver,
        maxHoursSinceOracleUpdates: 2,
        partiallyFillable: true,
      }),
      1,
      safe.safeAddress,
    ),
  );
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeGreaterThanOrEqual(
    beforeReview + 1800,
  );
  expect(onReviewOrder.mock.calls[0][0].validTo).toBeLessThanOrEqual(
    Math.floor(Date.now() / 1000) + 1800,
  );
});

it("does not prepare a draft from a non-positive required oracle price", async () => {
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) =>
    args.functionName === "latestRoundData"
      ? [BigInt(1), BigInt(0), BigInt(1), BigInt(1), BigInt(1)]
      : read(args),
  );
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(
    await screen.findByRole("button", {
      name: "Market price unavailable. Try again.",
    }),
  ).toBeDisabled();
  expect(onReviewOrder).not.toHaveBeenCalled();
});

it("rejects a zero receiver without clearing the editable form", async () => {
  useAdvancedSettingsStore.getState().setAdvancedSettings({
    ...defaultAdvancedSettings,
    receiver: "0x0000000000000000000000000000000000000000",
  });
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(await findReadyReviewButton());
  expect(
    await screen.findByText("Receiver must not be the zero address."),
  ).toHaveAttribute("role", "alert");
  expect(onReviewOrder).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("1");
});

it("resets committed slippage, expiry and exact-sell inputs when the chain changes", async () => {
  jest
    .spyOn(publicClientsFromIds[100], "readContract")
    .mockResolvedValue(BigInt("2000000000"));
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await switchLimitView(user, "Slippage");
  await user.clear(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
    "1",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await selectExpiry(user, VALID_TO_OPTIONS.MINUTES_30);
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "1980"),
  );

  safe = { ...safe, chainId: 100 };
  rerender(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm onReviewOrder={onReviewOrder} />
    </SWRConfig>,
  );
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("");
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "",
  );
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "");
  expect(screen.getByRole("img", { name: "USDT token" })).toBeInTheDocument();
  expect(
    screen.queryByRole("img", { name: "USDC token" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: /Set trigger to current market price/,
    }),
  ).not.toBeInTheDocument();
  expect(onReviewOrder).not.toHaveBeenCalled();
  expect(
    screen.getByRole("button", { name: "Select token" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Order settings" }),
  ).not.toHaveClass("text-primary");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(screen.getByRole("combobox", { name: "Execution" })).toHaveTextContent(
    "Fill or kill",
  );
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.YEAR,
  );
});

it("closes unapplied settings and resets expiry when the wallet changes", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await selectExpiry(user, VALID_TO_OPTIONS.MINUTES_30);
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x3333333333333333333333333333333333333333",
  );
  safe = { ...safe, safeAddress: "0x2222222222222222222222222222222222222222" };
  rerender(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm onReviewOrder={onReviewOrder} />
    </SWRConfig>,
  );
  expect(
    screen.queryByRole("group", { name: "Advanced order settings" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("combobox", { name: "Expires" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("combobox", { name: "Expires" })).toHaveTextContent(
    VALID_TO_OPTIONS.YEAR,
  );
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
});

it("ignores settings validation that finishes after a wallet change", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  let finish!: (address: Address) => void;
  const delayed = new Promise<Address>((resolve) => {
    finish = resolve;
  });
  const ens = jest
    .spyOn(publicClientsFromIds[1], "getEnsAddress")
    .mockImplementation(async () => delayed);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.type(screen.getByPlaceholderText("0xabc...123"), "receiver.eth");
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() => expect(ens).toHaveBeenCalled());
  safe = { ...safe, safeAddress: "0x2222222222222222222222222222222222222222" };
  rerender(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm onReviewOrder={onReviewOrder} />
    </SWRConfig>,
  );
  await act(async () => {
    finish("0x3333333333333333333333333333333333333333");
  });
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
});

it("resets the exact-sell form when the wallet changes", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  await selectWeth(user);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x3333333333333333333333333333333333333333",
  );
  await user.clear(screen.getByRole("spinbutton"));
  await user.type(screen.getByRole("spinbutton"), "2");
  await allowPartialExecutions(user);
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  safe = { ...safe, safeAddress: "0x2222222222222222222222222222222222222222" };
  rerender(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm onReviewOrder={onReviewOrder} />
    </SWRConfig>,
  );

  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Select token" }),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(screen.getByRole("combobox", { name: "Execution" })).toHaveTextContent(
    "Fill or kill",
  );
});

async function switchLimitView(
  user: ReturnType<typeof userEvent.setup>,
  mode: "Price" | "Slippage",
) {
  await user.click(
    within(screen.getByRole("group", { name: "Limit input mode" })).getByRole(
      "button",
      { name: mode },
    ),
  );
}

async function renderLimitExample() {
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) =>
    args.functionName === "balanceOf"
      ? BigInt("100000000000000000000")
      : read(args),
  );
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ quote: { buyAmount: "20000000000" } }),
  });
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Trigger price" }), "95");
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "10");
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
      "85.5",
    ),
  );
  return { user, onReviewOrder };
}

it("starts at the default 10% limit and reviews an exact manual price", async () => {
  const { user, onReviewOrder } = await renderLimitExample();
  const receive = screen.getByRole("status", { name: "Receive at least" });
  await waitFor(() => expect(receive).toHaveAttribute("title", "855"));
  expect(receive).toHaveTextContent("≈ 855");
  expect(
    screen.queryByRole("textbox", { name: "Receive at least" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Switch to Slippage" }),
  ).toHaveTextContent("Slippage: 10%");
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  const price = screen.getByRole("textbox", { name: "Limit price" });
  await user.clear(price);
  await user.type(price, "94");
  expect(receive).toHaveAttribute("title", "940");
  expect(
    screen.queryByText("Default", { exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Reset to default" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Switch to Slippage" }));
  expect(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  ).toHaveValue("1.0526");
  expect(receive).toHaveAttribute("title", "940");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSell: "10",
        amountBuy: "940",
        strikePrice: "95",
      }),
      1,
      safe.safeAddress,
    ),
  );
});

it("keeps the default at 10% when the sell amount and trigger change", async () => {
  const { user, onReviewOrder } = await renderLimitExample();
  await switchLimitView(user, "Slippage");
  const slippage = screen.getByRole("textbox", {
    name: "Slippage tolerance (%)",
  });
  expect(slippage).toHaveValue("10");
  const amount = screen.getByRole("textbox", { name: "Sell amount" });
  await user.clear(amount);
  await user.type(amount, "20");
  expect(slippage).toHaveValue("10");
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "1710");
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  await user.clear(trigger);
  await user.type(trigger, "96");
  expect(slippage).toHaveValue("10");
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  expect(
    screen.getByRole("status", { name: "Receive at least" }),
  ).toHaveAttribute("title", "1728");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSell: "20",
        strikePrice: "96",
        slippagePercent: "10",
        amountBuy: "1728",
      }),
      1,
      safe.safeAddress,
    ),
  );
  expect(
    fetchMock.mock.calls.every(
      ([url]) => !String(url).includes("slippageTolerance"),
    ),
  ).toBe(true);
});

it("uses the last slippage edit for the minimum received", async () => {
  const { user, onReviewOrder } = await renderLimitExample();
  await switchLimitView(user, "Slippage");
  const slippage = screen.getByRole("textbox", {
    name: "Slippage tolerance (%)",
  });
  await user.clear(slippage);
  await user.type(slippage, "2");
  const receive = screen.getByRole("status", { name: "Receive at least" });
  expect(receive).toHaveAttribute("title", "931");
  await user.click(screen.getByRole("button", { name: "Switch to Price" }));
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "93.1",
  );
  expect(receive).toHaveAttribute("title", "931");
  await user.click(await findReadyReviewButton());
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountBuy: "931", slippagePercent: "2" }),
      1,
      safe.safeAddress,
    ),
  );
});

it.each(["price", "slippage"] as const)(
  "preserves the last %s edit after view, trigger and amount changes",
  async (source) => {
    const { user, onReviewOrder } = await renderLimitExample();
    if (source === "slippage") await switchLimitView(user, "Slippage");
    const input = screen.getByRole("textbox", {
      name: source === "price" ? "Limit price" : "Slippage tolerance (%)",
    });
    await user.clear(input);
    await user.type(input, source === "price" ? "94" : "2");
    await switchLimitView(user, source === "price" ? "Slippage" : "Price");
    const trigger = screen.getByRole("textbox", { name: "Trigger price" });
    await user.clear(trigger);
    await user.type(trigger, "96");
    const receive = screen.getByRole("status", { name: "Receive at least" });
    expect(receive).toHaveAttribute(
      "title",
      source === "price" ? "940" : "940.8",
    );
    const amount = screen.getByRole("textbox", { name: "Sell amount" });
    await user.clear(amount);
    await user.type(amount, "20");
    expect(receive).toHaveAttribute(
      "title",
      source === "price" ? "1880" : "1881.6",
    );
    await switchLimitView(user, source === "price" ? "Price" : "Slippage");
    expect(
      screen.getByRole("textbox", {
        name: source === "price" ? "Limit price" : "Slippage tolerance (%)",
      }),
    ).toHaveValue(source === "price" ? "94" : "2");
    await user.click(await findReadyReviewButton());
    await waitFor(() =>
      expect(onReviewOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          amountSell: "20",
          amountBuy: source === "price" ? "1880" : "1881.6",
        }),
        1,
        safe.safeAddress,
      ),
    );
  },
);

it.each(["Price", "Slippage"] as const)(
  "resets to the default 10% limit without changing the %s view",
  async (view) => {
    const { user } = await renderLimitExample();
    const price = screen.getByRole("textbox", { name: "Limit price" });
    await user.clear(price);
    await user.type(price, "94");
    await switchLimitView(user, view);
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(
      within(screen.getByRole("group", { name: "Limit input mode" })).getByRole(
        "button",
        { name: view },
      ),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("textbox", {
        name: view === "Price" ? "Limit price" : "Slippage tolerance (%)",
      }),
    ).toHaveValue(view === "Price" ? "85.5" : "10");
    expect(
      screen.getByRole("status", { name: "Receive at least" }),
    ).toHaveAttribute("title", "855");
    expect(screen.getByText("Default", { exact: true })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).not.toBeInTheDocument();
  },
);

it("retains an invalid limit above the trigger and empty manual input", async () => {
  const { user, onReviewOrder } = await renderLimitExample();
  const price = screen.getByRole("textbox", { name: "Limit price" });
  await user.clear(price);
  await user.type(price, "96");
  expect(price).toHaveValue("96");
  expect(price).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    within(price.closest("section")!).queryByText(
      "Limit price must not exceed the trigger price",
    ),
  ).not.toBeInTheDocument();
  const receive = screen.getByRole("status", { name: "Receive at least" });
  expectUnavailableReceive(receive);
  expect(screen.getByText("Receive at least", { exact: true })).toBeVisible();
  expect(screen.getByRole("img", { name: "USDC token" })).toBeVisible();
  const submit = screen.getByRole("button", {
    name: "Limit price must not exceed the trigger price",
  });
  expect(submit).toBeDisabled();
  fireEvent.submit(price.closest("form")!);
  await act(async () => {});
  expect(submit).toBeDisabled();
  expect(onReviewOrder).not.toHaveBeenCalled();
  await switchLimitView(user, "Slippage");
  await switchLimitView(user, "Price");
  expect(price).toHaveValue("96");
  await user.clear(price);
  await user.tab();
  expect(price).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Reset to default" }),
  ).toBeVisible();
  await switchLimitView(user, "Slippage");
  await switchLimitView(user, "Price");
  expect(price).toHaveValue("");
  fireEvent.submit(price.closest("form")!);
  await act(async () => {});
  expect(onReviewOrder).not.toHaveBeenCalled();
});
