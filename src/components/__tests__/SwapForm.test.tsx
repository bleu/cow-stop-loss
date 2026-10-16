/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Address } from "viem";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { publicClientsFromIds } from "#/lib/publicClients";
import { createWagmiConfig } from "#/utils/wagmi";

import { SwapForm } from "../swap-card/SwapForm";

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

beforeEach(() => {
  safe = {
    chainId: 1,
    safeAddress: "0x1111111111111111111111111111111111111111",
  };
  useDraftOrder.getState().setCurrentDraftOrder(undefined);
  useAdvancedSettingsStore
    .getState()
    .setAdvancedSettings(defaultAdvancedSettings);
  jest.spyOn(publicClientsFromIds[1], "getBlock").mockResolvedValue({
    number: BigInt(1),
    timestamp: BigInt(1),
  } as Awaited<ReturnType<(typeof publicClientsFromIds)[1]["getBlock"]>>);
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "balanceOf") return BigInt("1123456789012345678");
      if (functionName === "domainSeparator") return `0x${"1".repeat(64)}`;
      if (functionName === "domainVerifiers") return COMPOSABLE_COW_ADDRESS;
      if (functionName === "decimals") return 8;
      return [
        BigInt(1),
        address?.toLowerCase() === "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
          ? BigInt("200000000000")
          : BigInt("100000000"),
        BigInt(1),
        BigInt(1),
        BigInt(1),
      ];
    });
});
afterEach(() => jest.restoreAllMocks());

it("replaces the order form with settings while settings are open", async () => {
  const user = userEvent.setup();
  renderForm();
  const heading = screen.getByRole("heading", {
    name: "Place a stop-loss order",
  });
  const settings = screen.getByRole("button", { name: "Order settings" });
  expect(heading.parentElement?.parentElement).toContainElement(settings);

  await user.click(settings);
  expect(
    screen.getByRole("group", { name: "Advanced order settings" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Sell" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("textbox", { name: "Buy" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Review Stop Loss order" }),
  ).not.toBeInTheDocument();
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
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue("1998"),
  );
  expect(screen.queryByText("1 WETH")).not.toBeInTheDocument();
});

it("shows default slippage only inside Advanced Settings and no limit input", async () => {
  const user = userEvent.setup();
  renderForm();

  expect(
    screen.queryByRole("textbox", { name: "Slippage" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Limit price")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(
    screen.getByRole("group", { name: "Advanced order settings" }),
  ).toBeInTheDocument();
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
});

async function selectWeth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
}

it("applies staged slippage only on Save and passes the recalculated minimum buy to review", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.clear(screen.getByRole("textbox", { name: "Trigger price" }));
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
      "2000",
    ),
  );
  await user.type(
    screen.getByRole("textbox", { name: "Sell amount" }),
    "0.123456789012345678",
  );

  const minimumBuy = screen.getByRole("textbox", { name: "Receive at least" });
  await waitFor(() => expect(minimumBuy).toHaveValue("246.666665"));
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "0.5");
  expect(minimumBuy).toHaveValue("246.666665");
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(minimumBuy).toHaveValue("245.679011"));
  expect(minimumBuy).toBeDisabled();
  expect(onReviewOrder).not.toHaveBeenCalled();

  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
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

it("blocks Save for invalid slippage without changing the committed amount", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
      "2000",
    ),
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const minimumBuy = screen.getByRole("textbox", { name: "Receive at least" });
  await waitFor(() => expect(minimumBuy).toHaveValue("1998"));
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  const slippage = screen.getByRole("textbox", { name: "Slippage" });
  await user.clear(slippage);
  await user.type(slippage, "0.001");
  await user.click(screen.getByRole("button", { name: "Return to order" }));

  expect(slippage).toHaveValue("0.001");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Slippage must be between 0% and 99.99% with at most two decimal places",
  );
  expect(
    screen.getByRole("group", { name: "Advanced order settings" }),
  ).toBeInTheDocument();
  expect(minimumBuy).toHaveValue("1998");
  expect(onReviewOrder).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({ amountBuy: "1998", slippagePercent: "0.1" }),
      1,
      safe.safeAddress,
    ),
  );
});

it("Close discards temporary slippage and receiver edits and reopens the saved values", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const minimumBuy = screen.getByRole("textbox", { name: "Receive at least" });
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "0.5");
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
  await waitFor(() => expect(minimumBuy).toHaveValue("1990"));

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
  await user.clear(screen.getByPlaceholderText("0xabc...123"));
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x3333333333333333333333333333333333333333",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(minimumBuy).toHaveValue("1990");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.5");
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue(
    "0x2222222222222222222222222222222222222222",
  );
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        slippagePercent: "0.5",
        amountBuy: "1990",
        receiver: "0x2222222222222222222222222222222222222222",
      }),
      1,
      safe.safeAddress,
    ),
  );
});

it("Reset immediately restores default slippage and the 24-hour oracle limit without Save", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  renderForm(onReviewOrder);
  await selectWeth(user);
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
      "2000",
    ),
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const minimumBuy = screen.getByRole("textbox", { name: "Receive at least" });
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x2222222222222222222222222222222222222222",
  );
  const oracleAge = screen.getByRole("spinbutton");
  await user.clear(oracleAge);
  await user.type(oracleAge, "2");
  await user.click(
    screen.getByRole("checkbox", { name: "Allow partial execution" }),
  );
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(minimumBuy).toHaveValue("1980"));

  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(
    screen.getByRole("checkbox", { name: "Allow partial execution" }),
  ).not.toBeChecked();
  await waitFor(() => expect(minimumBuy).toHaveValue("1998"));
  await user.keyboard("{Escape}");
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        slippagePercent: "0.1",
        amountBuy: "1998",
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
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
      "2000",
    ),
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );

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
    await user.click(
      await screen.findByRole("button", { name: "Review Stop Loss order" }),
    );

    await waitFor(() =>
      expect(onReviewOrder).toHaveBeenCalledWith(
        expect.objectContaining({ maxHoursSinceOracleUpdates }),
        1,
        safe.safeAddress,
      ),
    );
  },
);

it("marks saved slippage changes on the gear and offers Reset for slippage alone", async () => {
  const user = userEvent.setup();
  renderForm();
  const settingsTrigger = screen.getByRole("button", {
    name: "Order settings",
  });
  expect(settingsTrigger).not.toHaveClass("text-primary");
  await user.click(settingsTrigger);
  expect(
    screen.getByRole("button", { name: "Reset to default settings" }),
  ).toBeInTheDocument();
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
  expect(settingsTrigger).not.toHaveClass("text-primary");
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  expect(settingsTrigger).toHaveClass("text-primary");

  await user.click(settingsTrigger);
  await user.click(
    screen.getByRole("button", { name: "Reset to default settings" }),
  );
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
  expect(
    screen.getByRole("button", { name: "Reset to default settings" }),
  ).toBeInTheDocument();
  await user.keyboard("{Escape}");
  expect(settingsTrigger).not.toHaveClass("text-primary");
});

it("offers one exact-sell order without buy mode or draft-basket actions", () => {
  renderForm();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toBeEnabled();
  expect(
    screen.getByRole("textbox", { name: "Receive at least" }),
  ).toBeDisabled();
  expect(
    screen.queryByRole("radio", { name: /Toggle/ }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Add.*order|draft orders/i }),
  ).not.toBeInTheDocument();
});

it("blocks a sell amount one atomic unit above the wallet balance", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(
    screen.getByRole("textbox", { name: "Sell amount" }),
    "1.123456789012345679",
  );

  expect(
    await screen.findByRole("button", { name: "Insufficient balance" }),
  ).toBeDisabled();
});

it("accepts a trigger at market and rejects one atomic price unit above it", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  await user.type(trigger, "2000");
  expect(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  ).toBeEnabled();
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
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );

  await waitFor(() =>
    expect(onReviewOrder).toHaveBeenCalledWith(
      expect.objectContaining({
        amountSell: "0.123456789012345678",
        amountBuy: "246.666665",
        slippagePercent: "0.1",
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
  jest
    .mocked(publicClientsFromIds[1].getBlock)
    .mockRejectedValue(new Error("RPC unavailable"));
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
  screen.getByRole("combobox").focus();
  await user.keyboard("[Space]");
  await user.click(await screen.findByRole("option", { name: "30 minutes" }));
  const beforeReview = Math.floor(Date.now() / 1000);
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
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
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
  expect(
    await screen.findByText("Receiver must not be the zero address."),
  ).toHaveAttribute("role", "alert");
  expect(onReviewOrder).not.toHaveBeenCalled();
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("1");
});

it("resets committed slippage and exact-sell inputs when the chain changes", async () => {
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
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
  await user.click(screen.getByRole("button", { name: "Return to order" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("group", { name: "Advanced order settings" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue("1980"),
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
  expect(screen.getByRole("textbox", { name: "Receive at least" })).toHaveValue(
    "",
  );
  expect(
    screen.getByRole("button", { name: "Select token" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Order settings" }),
  ).not.toHaveClass("text-primary");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(
    screen.getByRole("checkbox", { name: "Allow partial fills" }),
  ).not.toBeChecked();
});

it("closes unapplied settings and resets expiry when the wallet changes", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  screen.getByRole("combobox").focus();
  await user.keyboard("[Space]");
  await user.click(await screen.findByRole("option", { name: "30 minutes" }));
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
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
  expect(screen.getByRole("combobox")).toHaveTextContent("6 months");
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
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
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
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
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
});

it("resets the exact-sell form when the wallet changes", async () => {
  const user = userEvent.setup();
  const onReviewOrder = jest.fn();
  const { rerender } = renderForm(onReviewOrder);
  await selectWeth(user);
  await user.click(screen.getByRole("button", { name: "Order settings" }));
  await user.clear(screen.getByRole("textbox", { name: "Slippage" }));
  await user.type(screen.getByRole("textbox", { name: "Slippage" }), "1");
  await user.type(
    screen.getByPlaceholderText("0xabc...123"),
    "0x3333333333333333333333333333333333333333",
  );
  await user.clear(screen.getByRole("spinbutton"));
  await user.type(screen.getByRole("spinbutton"), "2");
  await user.click(
    screen.getByRole("checkbox", { name: "Allow partial fills" }),
  );
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
  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
  expect(screen.getByPlaceholderText("0xabc...123")).toHaveValue("");
  expect(screen.getByRole("spinbutton")).toHaveValue(24);
  expect(
    screen.getByRole("checkbox", { name: "Allow partial fills" }),
  ).not.toBeChecked();
});
