/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FormProvider, useForm } from "react-hook-form";
import { SWRConfig } from "swr";
import type { Address } from "viem";

import { publicClientsFromIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";
import { TOKEN_WALLET, walletTokenRpc } from "#/test/walletTokenRpc";

import { TokenInputCard } from "../TokenInputCard";
import { TokenSelect } from "../TokenSelect";

let wallet: { address?: Address; chainId: number } = {
  address: TOKEN_WALLET,
  chainId: 1,
};
jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => wallet,
}));

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
});
afterEach(() => jest.restoreAllMocks());

function renderSelector() {
  wallet = { address: TOKEN_WALLET, chainId: 1 };
  const rpc = walletTokenRpc();
  const { sellTokens, buyToken } = getSupportedTokens(1);
  for (const { token, oracles } of [...sellTokens, buyToken]) {
    rpc.setBalance(token.address, BigInt(0));
    if (oracles.USD) rpc.setFeed(oracles.USD, BigInt("100000000"));
  }
  const weth = sellTokens.find(({ token }) => token.symbol === "WETH")!;
  const link = sellTokens.find(({ token }) => token.symbol === "LINK")!;
  rpc.setBalance(weth.token.address, BigInt("500000000000000000"));
  rpc.setFeed(weth.oracles.USD!, BigInt("268000000000"));
  rpc.setBalance(link.token.address, BigInt("185500000000000000000"));
  rpc.setFeed(link.oracles.USD!, BigInt("1420000000"));
  jest
    .spyOn(publicClientsFromIds[1], "getBlock")
    .mockImplementation(rpc.client.getBlock);
  jest
    .spyOn(publicClientsFromIds[1], "multicall")
    .mockImplementation(rpc.client.multicall);
  const onSelectToken = jest.fn();
  const view = render(<TokenSelect onSelectToken={onSelectToken} />, {
    wrapper: ({ children }) => (
      <SWRConfig
        value={{ provider: () => new Map(), dedupingInterval: 30_000 }}
      >
        {children}
      </SWRConfig>
    ),
  });
  return { ...view, rpc, onSelectToken, weth, link };
}

it("shows wallet balances in USD-value order and selects a token", async () => {
  const user = userEvent.setup();
  const { onSelectToken, link } = renderSelector();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("$2,634.10");
  const rows = screen.getAllByRole("option");
  expect(rows[0]).toHaveTextContent("LINK");
  expect(within(rows[0]).getByText("185.5")).toBeInTheDocument();
  expect(rows[1]).toHaveTextContent("WETH");
  await user.click(rows[0]);
  expect(onSelectToken).toHaveBeenCalledWith(link.token);
  await waitFor(() =>
    expect(screen.queryByRole("option")).not.toBeInTheDocument(),
  );
});

it("caps balance decimals and keeps tiny balances distinct from zero", async () => {
  const user = userEvent.setup();
  const { rpc, weth, link } = renderSelector();
  rpc.setBalance(weth.token.address, BigInt(1));
  rpc.setBalance(link.token.address, BigInt("1234567890123456789"));
  await user.click(screen.getByRole("button", { name: "Select token" }));
  const wethRow = await screen.findByRole("option", { name: /WETH.*<0\.0001/ });
  expect(within(wethRow).getByText("<0.0001")).toBeVisible();
  expect(
    within(screen.getByRole("option", { name: /LINK/ })).getByText("1.2346"),
  ).toBeVisible();
  expect(
    within(screen.getByRole("option", { name: /AAVE/ })).getByText("0"),
  ).toBeVisible();
});

it("lets the user retry failed balance reads without hiding supported tokens", async () => {
  const user = userEvent.setup();
  const { rpc } = renderSelector();
  jest
    .mocked(publicClientsFromIds[1].getBlock)
    .mockRejectedValueOnce(new Error("RPC unavailable"));
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("Balances unavailable");
  expect(screen.getAllByRole("option")).toHaveLength(
    getSupportedTokens(1).sellTokens.length,
  );
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByText("$2,634.10");
  expect(rpc.calls.filter(({ method }) => method === "eth_call")).toHaveLength(
    1,
  );
});

it("shares list balances and prices with the amount cards and keeps Max exact", async () => {
  const user = userEvent.setup();
  const { rpc, link, unmount } = renderSelector();
  unmount();
  const exact = BigInt("185500000000000000001");
  rpc.setBalance(link.token.address, exact);
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockRejectedValue(new Error("Unexpected individual read"));
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(20_000_000));
  function Cards() {
    const form = useForm<SwapData>({
      defaultValues: {
        tokenSell: link.token,
        tokenBuy: getSupportedTokens(1).buyToken.token,
      },
    });
    return (
      <FormProvider {...form}>
        <TokenInputCard side="Sell" />
        <TokenInputCard side="Buy" />
      </FormProvider>
    );
  }
  render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 30_000 }}>
      <Cards />
    </SWRConfig>,
  );
  await user.click(await screen.findByRole("button", { name: "Max" }));
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue(
    "185.500000000000000001",
  );
  await screen.findByText(/2,634.10/);
  await user.click(screen.getByRole("button", { name: /LINK/ }));
  await screen.findByRole("option", { name: /LINK/ });
  expect(rpc.calls.filter(({ method }) => method === "eth_call")).toHaveLength(
    1,
  );
  expect(read).not.toHaveBeenCalled();
});

it("ignores late balances from a previous wallet", async () => {
  const user = userEvent.setup();
  const { rpc, rerender, onSelectToken } = renderSelector();
  let finish!: (block: Awaited<ReturnType<typeof rpc.client.getBlock>>) => void;
  jest.mocked(publicClientsFromIds[1].getBlock).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await waitFor(() => expect(finish).toBeDefined());
  expect(screen.getAllByText("Loading…").length).toBeGreaterThan(0);
  wallet = {
    address: "0x2222222222222222222222222222222222222222",
    chainId: 1,
  };
  for (const { token } of [
    ...getSupportedTokens(1).sellTokens,
    getSupportedTokens(1).buyToken,
  ])
    rpc.setBalance(token.address, BigInt(0), wallet.address);
  rerender(<TokenSelect onSelectToken={onSelectToken} />);
  await screen.findAllByText("$0.00");
  await act(async () => {
    finish(await rpc.client.getBlock());
  });
  expect(screen.queryByText("$2,634.10")).not.toBeInTheDocument();
  expect(screen.queryByText("185.5")).not.toBeInTheDocument();
});

it("keeps the value order while searching and reuses cached reads after reopening", async () => {
  const user = userEvent.setup();
  const { rpc } = renderSelector();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("$2,634.10");
  await user.type(screen.getByPlaceholderText("Search supported tokens"), "0x");
  expect(screen.getAllByRole("option")[0]).toHaveTextContent("LINK");
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("$2,634.10");
  expect(rpc.calls.filter(({ method }) => method === "eth_call")).toHaveLength(
    1,
  );
});

it("removes old balances when a refresh fails", async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
  try {
    renderSelector();
    await user.click(screen.getByRole("button", { name: "Select token" }));
    await screen.findByText("$2,634.10");
    jest
      .mocked(publicClientsFromIds[1].getBlock)
      .mockRejectedValue(new Error("RPC unavailable"));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(60_001);
    });
    expect(screen.queryByText("$2,634.10")).not.toBeInTheDocument();
    expect(screen.getByText("Balances unavailable")).toBeVisible();
  } finally {
    jest.useRealTimers();
  }
});

it("clears previous-chain values while the new chain loads", async () => {
  const user = userEvent.setup();
  const { rerender, onSelectToken } = renderSelector();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("$2,634.10");
  jest
    .spyOn(publicClientsFromIds[42161], "getBlock")
    .mockImplementation(() => new Promise(() => {}));
  wallet = { address: TOKEN_WALLET, chainId: 42161 };
  rerender(<TokenSelect onSelectToken={onSelectToken} />);
  await screen.findAllByText("Loading…");
  expect(screen.queryByText("$2,634.10")).not.toBeInTheDocument();
  expect(screen.getAllByRole("option")).toHaveLength(
    getSupportedTokens(42161).sellTokens.length,
  );
});

it("supports keyboard selection and reports an empty search", async () => {
  const user = userEvent.setup();
  const { onSelectToken, link } = renderSelector();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await screen.findByText("$2,634.10");
  const search = screen.getByPlaceholderText("Search supported tokens");
  await user.type(search, "no-such-token");
  expect(screen.getByText("No results found")).toBeVisible();
  await user.clear(search);
  await user.type(search, "LINK");
  await user.keyboard("{ArrowDown}{Enter}");
  expect(onSelectToken).toHaveBeenCalledWith(link.token);
});

it("keeps supported tokens selectable without a wallet or balance requests", async () => {
  const user = userEvent.setup();
  const { rpc, rerender, onSelectToken, link } = renderSelector();
  wallet = { chainId: 1 };
  rerender(<TokenSelect onSelectToken={onSelectToken} />);
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.type(
    screen.getByPlaceholderText("Search supported tokens"),
    link.token.address,
  );
  await user.click(screen.getByRole("option", { name: /LINK/ }));
  expect(onSelectToken).toHaveBeenCalledWith(link.token);
  expect(
    rpc.contractCalls.some(({ functionName }) => functionName === "balanceOf"),
  ).toBe(false);
  expect(screen.queryByText("$2,634.10")).not.toBeInTheDocument();
});
