/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import type { Address } from "viem";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { useDraftOrders } from "#/hooks/useDraftOrders";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { publicClientsFromIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { createWagmiConfig } from "#/utils/wagmi";

import { SwapForm } from "../swap-card/SwapForm";

let safe: { chainId: number; safeAddress: Address } = {
  chainId: 1,
  safeAddress: "0x1111111111111111111111111111111111111111",
};
jest.mock("@safe-global/safe-apps-react-sdk", () => ({
  useSafeAppsSDK: () => ({ safe, sdk: {} }),
}));
jest.mock("@safe-global/safe-gateway-typescript-sdk", () => ({
  getTransactionQueue: jest.fn().mockResolvedValue({ results: [] }),
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
  useDraftOrders.getState().setDraftOrders([]);
  useDraftOrder.getState().setCurrentDraftOrder(undefined);
  useAdvancedSettingsStore
    .getState()
    .setAdvancedSettings(defaultAdvancedSettings);
  const { sellTokens } = getSupportedTokens(1);
  global.fetch = jest.fn().mockImplementation(async (input) => ({
    json: async () => ({
      price: String(input)
        .toLowerCase()
        .includes(sellTokens[0].token.address.toLowerCase())
        ? 2000
        : 1e12,
    }),
  }));
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

function renderForm() {
  const config = createWagmiConfig();
  const queryClient = new QueryClient();
  return render(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm />
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

it("starts with custom slippage at 0.1% and no limit input", () => {
  renderForm();

  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
  expect(screen.queryByText("Limit price")).not.toBeInTheDocument();
});

async function selectWeth(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
}

it("recalculates the minimum buy from the exact sell, trigger and slippage", async () => {
  const user = userEvent.setup();
  renderForm();
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
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue("246.666665"),
  );
  await user.click(screen.getByRole("radio", { name: "0.5%" }));
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue("245.679011"),
  );
  expect(
    screen.getByRole("textbox", { name: "Receive at least" }),
  ).toBeDisabled();
});

it("clears a stale derived amount and blocks review while slippage is invalid", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue("1998"),
  );
  const slippage = screen.getByRole("textbox", { name: "Slippage" });
  await user.clear(slippage);
  await user.type(slippage, "0.001");

  expect(slippage).toHaveValue("0.001");
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Slippage must be between 0% and 99.99% with at most two decimal places",
  );
  await waitFor(() =>
    expect(
      screen.getByRole("textbox", { name: "Receive at least" }),
    ).toHaveValue(""),
  );
  expect(
    await screen.findByRole("button", { name: /Slippage must/ }),
  ).toBeDisabled();
});

it("keeps the exact buy authoritative when mode, trigger and custom slippage change", async () => {
  const user = userEvent.setup();
  renderForm();
  await selectWeth(user);
  await user.click(screen.getByRole("radio", { name: "Toggle buy" }));
  const trigger = screen.getByRole("textbox", { name: "Trigger price" });
  const slippage = screen.getByRole("textbox", { name: "Slippage" });
  await user.type(trigger, "3");
  await user.clear(slippage);
  await user.type(slippage, "0");
  await user.type(screen.getByRole("textbox", { name: "Buy amount" }), "1");

  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Sell at most" })).toHaveValue(
      "0.333333333333333333",
    ),
  );
  expect(screen.getByRole("textbox", { name: "Sell at most" })).toBeDisabled();
  await user.clear(trigger);
  await user.type(trigger, "4");
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Sell at most" })).toHaveValue(
      "0.25",
    ),
  );
  await user.clear(slippage);
  await user.type(slippage, "50");
  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Sell at most" })).toHaveValue(
      "0.5",
    ),
  );
  expect(screen.getByRole("textbox", { name: "Buy amount" })).toHaveValue("1");
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

it("opens review with the same exact amounts shown by the form", async () => {
  const user = userEvent.setup();
  renderForm();
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

  const review = within(
    await screen.findByRole("dialog", { name: "Review Stop Loss order" }),
  );
  expect(review.getByText("0.123456789012345678 WETH")).toBeInTheDocument();
  expect(review.getByText("246.666665 USDC")).toBeInTheDocument();
  expect(review.getByText("0.1%")).toBeInTheDocument();
  expect(review.queryByText("Limit price")).not.toBeInTheDocument();
});

it("resets slippage and the visible exact mode when the wallet changes", async () => {
  const user = userEvent.setup();
  const { rerender } = renderForm();
  await selectWeth(user);
  await user.click(screen.getByRole("radio", { name: "Toggle buy" }));
  await user.click(screen.getByRole("radio", { name: "1%" }));
  await user.type(screen.getByRole("textbox", { name: "Buy amount" }), "1");
  safe = { ...safe, safeAddress: "0x2222222222222222222222222222222222222222" };
  rerender(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <SwapForm />
    </SWRConfig>,
  );

  await waitFor(() =>
    expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue(
      "0.1",
    ),
  );
  expect(screen.getByRole("radio", { name: "Toggle sell" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("");
  expect(
    screen.getByRole("button", { name: "Select token" }),
  ).toBeInTheDocument();
});
