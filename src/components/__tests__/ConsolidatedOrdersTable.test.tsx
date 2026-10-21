/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { toast } from "@bleu/ui";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { randomUUID } from "crypto";
import { EventEmitter } from "events";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import React from "react";
import { deserialize, serialize } from "v8";
import { disconnect } from "wagmi/actions";

import OrderPage from "#/app/[chainId]/[safeAddress]/[orderId]/page";
import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { RootLayout } from "#/components/RootLayout";
import { getStopLossPlacement } from "#/hooks/useStopLossPlacement";
import * as tokenPairPrice from "#/hooks/useTokenPairPrice";
import type { PreparedPlacement } from "#/lib/pollerStopLoss";
import { publicClientsFromIds, supportedChainIds } from "#/lib/publicClients";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import { createStopLossPlacement } from "#/lib/stopLossPlacement";
import { OrderStatus } from "#/lib/types";
import { createWagmiConfig } from "#/utils/wagmi";

const account = "0x1111111111111111111111111111111111111111";
const otherAccount = "0x2222222222222222222222222222222222222222";
const owner = "0x4444444444444444444444444444444444444444";
const originalFetch = global.fetch;
const originalLocks = Object.getOwnPropertyDescriptor(navigator, "locks");
const originalClone = global.structuredClone;
let config: ReturnType<typeof createWagmiConfig>;
let provider: BrowserWallet;
let writer: ReturnType<typeof createStopLossPlacement>;
let stopWriter: () => void;
const previousLocks = new Map<string, Promise<unknown>>();
const locks = {
  request<T>(name: string, action: () => T | Promise<T>) {
    const result = (previousLocks.get(name) ?? Promise.resolve()).then(action);
    previousLocks.set(
      name,
      result.then(
        () => undefined,
        () => undefined,
      ),
    );
    return result;
  },
};

function prepared(
  chainId: PreparedPlacement["chainId"] = 100,
  wallet: PreparedPlacement["account"] = account,
): PreparedPlacement {
  const draft: PreparedPlacement["draft"] = {
    id: "reviewed-order",
    tokenSell: {
      address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      decimals: 18,
      symbol: "WETH",
    },
    tokenBuy: {
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
      symbol: "USDC",
    },
    amountSell: "1",
    amountBuy: "1980",
    strikePrice: "2000",
    limitPrice: "1980",
    slippagePercent: "1",
    isSellOrder: true,
    receiver: wallet,
    partiallyFillable: true,
    maxHoursSinceOracleUpdates: 1,
    validTo: 4102444800,
    salt: `0x${"ab".repeat(32)}`,
    tokenSellOracle: "0x8888888888888888888888888888888888888888",
    tokenBuyOracle: "0x9999999999999999999999999999999999999999",
    oraclePrice: 2000,
    status: OrderStatus.DRAFT,
  };
  const appDataHash = `0x${"ee".repeat(32)}` as const;
  return {
    account: wallet,
    chainId,
    owner,
    factory: "0x3333333333333333333333333333333333333333",
    poller: "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    scheduleId: `0x${"aa".repeat(32)}`,
    paramsHash: `0x${"bb".repeat(32)}`,
    orderDigest: `0x${"cc".repeat(32)}`,
    domainSeparator: `0x${"dd".repeat(32)}`,
    appDataHash,
    fullAppData: "{}",
    draft,
    staticInput: encodeStopLossStaticInput(draft, appDataHash),
  };
}

function apiParent(
  chainId = 1,
  eventId = "indexed-order",
  hash = `0x${"ab".repeat(32)}`,
) {
  return {
    eventId,
    chainId,
    owner,
    resolvedOwner: account,
    status: "Active",
    orderType: "StopLoss",
    handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
    hash,
    transaction: { hash: `0x${"ef".repeat(32)}`, blockTimestamp: "1700000000" },
    decodedParams: {
      sellToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
      buyToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      sellAmount: "2000000000000000000",
      buyAmount: "4000000000",
      receiver: account,
      validTo: 4102444800,
      isSellOrder: true,
      isPartiallyFillable: true,
      strike: "2100000000000000000000",
      sellTokenPriceOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
      buyTokenPriceOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
      maxTimeSinceLastOracleUpdate: 3600,
    },
    discreteOrders: { items: [] },
  };
}

function serveOrders(
  orders: ReturnType<typeof apiParent>[],
  unavailable = new Set<number>(),
) {
  global.fetch = jest.fn(async (_url, init) => {
    const body = JSON.parse(init?.body as string);
    if (body.method || Array.isArray(body)) throw new Error("RPC unavailable");
    const { query, variables } = body;
    if (unavailable.has(variables.chain))
      return { ok: false, status: 503 } as Response;
    const field = query.includes("ownerMappings")
      ? "ownerMappings"
      : "conditionalOrderGenerators";
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          [field]: {
            items:
              field === "ownerMappings"
                ? []
                : orders.filter((order) => order.chainId === variables.chain),
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    } as Response;
  });
}

class BrowserWallet extends EventEmitter {
  accounts: string[] = [account];
  chainId = 1;
  async request({ method }: { method: string }) {
    if (method === "eth_accounts" || method === "eth_requestAccounts")
      return this.accounts;
    if (method === "eth_estimateGas") return "0x493e0";
    if (method === "eth_sendTransaction") return `0x${"cd".repeat(32)}`;
    if (method === "eth_chainId") return `0x${this.chainId.toString(16)}`;
    if (method === "wallet_requestPermissions")
      return [{ parentCapability: "eth_accounts" }];
    if (method === "wallet_revokePermissions") return null;
    throw new Error(`Unexpected wallet request: ${method}`);
  }
}

function TableView({ search = "" }: { search?: string }) {
  const [url, setUrl] = React.useState(
    new URL(`http://localhost/app${search}`),
  );
  const router = React.useMemo(
    () => ({
      push: (href: string) => {
        window.history.pushState(null, "", href);
        setUrl(new URL(href, "http://localhost"));
      },
      replace: (href: string) => {
        window.history.replaceState(null, "", href);
        setUrl(new URL(href, "http://localhost"));
      },
      back() {},
      forward() {},
      refresh() {},
      prefetch() {},
    }),
    [],
  );
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={url.pathname}>
        <SearchParamsContext.Provider value={url.searchParams}>
          <RootLayout config={config}>
            <ConsolidatedOrdersTable />
          </RootLayout>
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

async function connectWallet() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Connect wallet" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Browser wallet" }),
  );
  await screen.findByTitle(account);
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

async function confirm(order = prepared()) {
  const placement = writer;
  await placement.submit(order, "setup", {
    send: async () => ({ id: "wallet-reference" }),
  });
  await placement.resume(order, { checkState: async () => true });
}

beforeAll(() => {
  jest.spyOn(Date, "now").mockImplementation(() => new Date().getTime());
  global.structuredClone ??= (value) => deserialize(serialize(value));
  if (!crypto.randomUUID)
    Object.defineProperty(crypto, "randomUUID", {
      configurable: true,
      value: randomUUID,
    });
  Object.assign(globalThis, {
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  Element.prototype.scrollIntoView = () => {};
  Reflect.deleteProperty(navigator, "locks");
  getStopLossPlacement();
});

beforeEach(() => {
  toast({}).dismiss();
  localStorage.clear();
  writer = createStopLossPlacement({ locks, now: () => new Date().getTime() });
  stopWriter = writer.subscribe(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: "stop-loss-placement" }),
    ),
  );
  window.history.replaceState(null, "", "/app");
  config = createWagmiConfig();
  provider = new BrowserWallet();
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  serveOrders([]);
});

afterEach(async () => {
  jest.useRealTimers();
  stopWriter();
  await act(async () => {
    await disconnect(config);
  });
  global.fetch = originalFetch;
  Reflect.deleteProperty(window, "ethereum");
  localStorage.clear();
  jest.restoreAllMocks();
});

afterAll(() => {
  if (originalLocks) Object.defineProperty(navigator, "locks", originalLocks);
  else Reflect.deleteProperty(navigator, "locks");
  global.structuredClone = originalClone;
});

test.each([
  { indexed: false, encoded: false },
  { indexed: true, encoded: false },
  { indexed: false, encoded: true },
  { indexed: true, encoded: true },
])(
  "opens the success notification identity with indexed order: $indexed, encoded: $encoded",
  async ({ indexed, encoded }) => {
    const order = prepared(1);
    if (indexed)
      serveOrders([apiParent(1, "canonical-order", order.paramsHash)]);
    else await confirm(order);
    jest
      .spyOn(publicClientsFromIds[1], "getBlockNumber")
      .mockResolvedValue(BigInt(100));
    jest.spyOn(publicClientsFromIds[1], "getBlock").mockResolvedValue({
      number: BigInt(100),
      timestamp: BigInt(Math.floor(Date.now() / 1000)),
    } as never);
    jest
      .spyOn(publicClientsFromIds[1], "readContract")
      .mockImplementation(async ({ functionName }) => {
        if (functionName === "decimals") return 8;
        if (functionName === "latestRoundData")
          return [
            BigInt(1),
            BigInt(100000000),
            BigInt(1),
            BigInt(Math.floor(Date.now() / 1000)),
            BigInt(1),
          ];
        return BigInt(0);
      });
    render(
      <RootLayout config={config}>
        <OrderPage
          params={{
            chainId: "1",
            safeAddress: account,
            orderId: encoded
              ? encodeURIComponent(`${order.owner}:${order.paramsHash}`)
              : `${order.owner}:${order.paramsHash}`,
          }}
        />
      </RootLayout>,
    );
    await connectWallet();
    expect(await screen.findByText("Order information")).toBeInTheDocument();
    expect(screen.queryByText(/Order not found/)).not.toBeInTheDocument();
  },
);

test("reviews cancellation of a confirmed local order before API indexing", async () => {
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(100));
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName }) => {
      if (
        functionName === "COW_SHED_FACTORY" ||
        functionName === "trustedExecutor"
      )
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf") return owner;
      if (functionName === "singleOrders") return true;
      throw new Error(`Unexpected RPC read: ${functionName}`);
    });
  await confirm(prepared(1));
  render(<TableView />);
  await connectWallet();
  const amount = await screen.findByRole("cell", {
    name: "1 WETH for 1980 USDC",
  });
  const row = amount.closest("tr")!;
  const status = within(row).getByRole("cell", { name: "Open" });
  expect(within(status).getByText("Open")).toBeInTheDocument();
  expect(status.querySelector("p")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Waiting for API indexing"),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("row", { name: /^View order/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: /^Cancel order/ }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Remaining sell")).toBeInTheDocument();
  expect(within(dialog).getByText("1 WETH")).toBeInTheDocument();
  expect(within(dialog).getByText("Minimum buy")).toBeInTheDocument();
  expect(within(dialog).getByText("1980 USDC")).toBeInTheDocument();
  expect(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  ).toBeInTheDocument();
});

test("opens cancellation from an order row without navigating to its details", async () => {
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(100));
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName }) => {
      if (
        functionName === "COW_SHED_FACTORY" ||
        functionName === "trustedExecutor"
      )
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf") return owner;
      if (functionName === "singleOrders") return true;
      throw new Error(`Unexpected RPC read: ${functionName}`);
    });
  serveOrders([apiParent()]);
  render(<TableView />);
  await connectWallet();

  const cancelButton = screen.getByRole("button", { name: /^Cancel order/ });
  fireEvent.click(cancelButton);

  expect(window.location.pathname).toBe("/app");
  expect(
    await screen.findByRole("heading", { name: "Cancel this order?" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("heading", { name: "Order details" }),
  ).not.toBeInTheDocument();
  fireEvent.click(
    within(await screen.findByRole("dialog")).getByRole("button", {
      name: "Close",
    }),
  );
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(window.location.pathname).toBe("/app");
});

test("keeps a cancelled local creation cancelled when its stale API row arrives", async () => {
  const indexed: ReturnType<typeof apiParent>[] = [];
  serveOrders(indexed);
  let active = true;
  let block = BigInt(100);
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockImplementation(async () => block);
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName }) => {
      if (
        functionName === "COW_SHED_FACTORY" ||
        functionName === "trustedExecutor"
      )
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf") return owner;
      if (functionName === "singleOrders") return active;
      throw new Error(`Unexpected RPC read: ${functionName}`);
    });
  jest
    .spyOn(publicClientsFromIds[1], "getTransactionReceipt")
    .mockRejectedValue(
      Object.assign(new Error("not found"), {
        name: "TransactionReceiptNotFoundError",
      }),
    );
  const local = prepared(1);
  await confirm(local);
  const request = jest.spyOn(provider, "request");
  render(<TableView />);
  await connectWallet();
  fireEvent.click(await screen.findByRole("button", { name: /^Cancel order/ }));
  const dialog = await screen.findByRole("dialog");
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() =>
    expect(
      request.mock.calls.some(
        ([args]) => args.method === "eth_sendTransaction",
      ),
    ).toBe(true),
  );
  active = false;
  block = BigInt(101);
  await waitFor(
    () => expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
    { timeout: 4000 },
  );
  indexed.push(apiParent(1, "indexed-local", local.paramsHash));
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  await screen.findByRole("row", {
    name: "View order indexed-local on Ethereum",
  });
  expect(screen.getByRole("cell", { name: "Cancelled" })).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(2);
  active = true;
  block = BigInt(102);
  indexed[0] = apiParent(1, "recreated-local", local.paramsHash);
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  await screen.findByRole("row", {
    name: "View order recreated-local on Ethereum",
  });
  expect(screen.getByRole("cell", { name: "Open" })).toBeInTheDocument();
  expect(screen.getAllByRole("row")).toHaveLength(2);
});

test("shows the portfolio heading without table controls when the wallet is disconnected", () => {
  render(<TableView />);

  const title = screen.getByRole("heading", {
    level: 2,
    name: "Your stop-loss orders",
  });
  expect(title).toHaveAttribute("id", "orders-title");
  expect(title.parentElement).toHaveClass("rescue-portfolio-title");
  expect(within(title.parentElement!).getByText("Portfolio")).toHaveClass(
    "rescue-eyebrow",
  );
  expect(title.parentElement!.parentElement).toHaveClass(
    "rescue-panel-heading",
    "rescue-portfolio-heading",
  );
  expect(
    screen.getByRole("button", { name: "Connect wallet to view orders" }),
  ).toBeVisible();
  expect(
    screen.queryByRole("button", { name: "Filters" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Refresh orders" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});

test("fills the empty orders viewport with heading controls outside its scroll area", async () => {
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "No results." });

  const table = screen.getByRole("table");
  const viewport = screen.getByRole("region", { name: "Table rows" });
  const frame = viewport.parentElement!;
  const panel = frame.parentElement!;
  expect(panel).toHaveClass("flex", "h-full", "min-h-0", "flex-1", "flex-col");
  expect(frame).toHaveClass(
    "pixel-frame",
    "flex",
    "min-h-0",
    "min-w-0",
    "flex-1",
    "flex-col",
    "rounded-none",
    "border",
    "border-border/70",
    "bg-background/35",
    "p-0.5",
  );
  expect(panel.querySelectorAll(".pixel-frame")).toHaveLength(1);
  expect(frame).not.toHaveClass("overflow-auto");
  expect(viewport).toHaveAttribute("tabindex", "0");
  expect(viewport).toContainElement(table);
  expect(viewport).toHaveClass(
    "min-h-0",
    "min-w-0",
    "flex-1",
    "max-h-none",
    "overflow-auto",
    "[&>div]:overflow-visible",
    "[&>div]:h-full",
  );
  expect(viewport).not.toHaveClass("max-h-96");
  expect(viewport).not.toHaveClass("pixel-frame");
  expect(table).toHaveClass("h-full");
  expect(table.querySelector("thead")).toHaveClass(
    "sticky",
    "top-0",
    "z-10",
    "bg-background",
  );
  const title = screen.getByRole("heading", {
    level: 2,
    name: "Your stop-loss orders",
  });
  expect(title).toHaveAttribute("id", "orders-title");
  expect(title.parentElement).toHaveClass("rescue-portfolio-title");
  const heading = title.parentElement!.parentElement!;
  expect(heading).toHaveClass(
    "rescue-panel-heading",
    "rescue-portfolio-heading",
  );
  const refresh = screen.getByRole("button", { name: "Refresh orders" });
  const toolbar = refresh.closest<HTMLDivElement>(".rescue-portfolio-toolbar")!;
  expect(heading).toContainElement(toolbar);
  expect(toolbar).toContainElement(
    screen.getByRole("button", { name: "Filters" }),
  );
  expect(toolbar).toContainElement(
    screen.getByRole("button", { name: "Reset filters" }),
  );
  expect(screen.getByRole("button", { name: "Reset filters" })).toBeDisabled();
  expect(heading).toContainElement(screen.getByLabelText("Selected filters"));
  expect(refresh).toBeEnabled();
  expect(panel).not.toContainElement(heading);
  expect(panel.firstElementChild).toBe(frame);
  expect(panel.lastElementChild).toBe(frame);
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();
  expect(viewport).not.toContainElement(toolbar);
  expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
});

test("restores and combines chain and status filters from the URL without changing refresh", async () => {
  const canceled = {
    ...apiParent(1, "canceled-order", `0x${"cd".repeat(32)}`),
    status: "Cancelled",
  };
  serveOrders([
    apiParent(1, "ethereum-open"),
    apiParent(100, "gnosis-open"),
    apiParent(42161, "arbitrum-open"),
    canceled,
  ]);
  render(
    <TableView search="?chainId=1.100&status=Open.Canceled&view=compact" />,
  );
  await connectWallet();
  await screen.findByRole("row", { name: "View order gnosis-open on Gnosis" });
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(3);
  const trigger = screen.getByRole("button", { name: "Filters" });
  expect(trigger).toHaveAccessibleDescription("4 selected filters");
  expect(screen.getByLabelText("Selected filters")).toHaveTextContent(
    "Chain: Ethereum, Gnosis / Status: Open, Canceled",
  );

  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", {
    name: "Filter your orders",
  });
  const chains = within(dialog).getByRole("group", { name: "Chain" });
  const statuses = within(dialog).getByRole("group", { name: "Status" });
  expect(
    within(chains).getByRole("checkbox", { name: "Ethereum" }),
  ).toBeChecked();
  expect(
    within(statuses).getByRole("checkbox", { name: "Canceled" }),
  ).toBeChecked();
  fireEvent.click(within(chains).getByRole("checkbox", { name: "Gnosis" }));
  fireEvent.click(within(statuses).getByRole("checkbox", { name: "Open" }));
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get("chainId")).toBe("1");
    expect(params.get("status")).toBe("Canceled");
    expect(params.get("page")).toBe("1");
    expect(params.get("view")).toBe("compact");
  });
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(1);
  expect(
    screen.getByRole("row", { name: "View order canceled-order on Ethereum" }),
  ).toBeVisible();
  expect(trigger).toHaveAccessibleDescription("2 selected filters");
  fireEvent.keyDown(dialog, { key: "Escape" });
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Filter your orders" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(trigger).toHaveFocus());

  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Refresh orders" }),
    ).toBeEnabled(),
  );
  expect(trigger).toHaveAccessibleDescription("2 selected filters");
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "Reset filters" }));
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.has("chainId")).toBe(false);
    expect(params.has("status")).toBe(false);
    expect(params.get("view")).toBe("compact");
    expect(params.get("sort")).toBe("chainId.asc");
  });
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(4);
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();
  expect(
    await screen.findByRole("row", {
      name: "View order arbitrum-open on Arbitrum",
    }),
  ).toBeVisible();
  expect(screen.getByLabelText("Selected filters")).toHaveTextContent(
    "Chain: All / Status: All",
  );
  expect(screen.getByRole("button", { name: "Reset filters" })).toBeDisabled();
});

test("clears each filter group without clearing the other and restores All after the last selection", async () => {
  serveOrders([apiParent()]);
  render(<TableView search="?chainId=1.100&status=Open.Expired" />);
  await connectWallet();
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  const dialog = await screen.findByRole("dialog", {
    name: "Filter your orders",
  });
  const chains = within(dialog).getByRole("group", { name: "Chain" });
  const statuses = within(dialog).getByRole("group", { name: "Status" });
  fireEvent.click(within(chains).getByRole("checkbox", { name: "All chains" }));
  expect(
    within(chains).getByRole("checkbox", { name: "All chains" }),
  ).toBeChecked();
  expect(
    within(statuses).getByRole("checkbox", { name: "Open" }),
  ).toBeChecked();
  expect(
    within(statuses).getByRole("checkbox", { name: "Expired" }),
  ).toBeChecked();
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.has("chainId")).toBe(false);
    expect(params.get("status")).toBe("Open.Expired");
  });
  fireEvent.click(within(chains).getByRole("checkbox", { name: "Gnosis" }));
  fireEvent.click(
    within(statuses).getByRole("checkbox", { name: "All statuses" }),
  );
  await waitFor(() => {
    const params = new URLSearchParams(window.location.search);
    expect(params.get("chainId")).toBe("100");
    expect(params.has("status")).toBe(false);
  });
  expect(
    within(statuses).getByRole("checkbox", { name: "All statuses" }),
  ).toBeChecked();
  expect(screen.getByLabelText("Selected filters")).toHaveTextContent(
    "Chain: Gnosis / Status: All",
  );
  fireEvent.click(within(chains).getByRole("checkbox", { name: "Gnosis" }));
  expect(
    within(chains).getByRole("checkbox", { name: "All chains" }),
  ).toBeChecked();
  expect(
    screen.getByRole("button", { name: "Filters" }),
  ).toHaveAccessibleDescription("All chains and statuses");
  expect(screen.getByRole("button", { name: "Reset filters" })).toBeDisabled();
});

test("keeps long selected values in a separate bounded summary and in the filter panel", async () => {
  const statuses = [
    "Open",
    "Filled",
    "Canceled",
    "Expired",
    "Partially filled, cancelled",
    "Partially filled, expired",
  ];
  render(
    <TableView
      search={`?chainId=${supportedChainIds.join(".")}&status=${encodeURIComponent(statuses.join("."))}`}
    />,
  );
  await connectWallet();
  const summary = screen.getByLabelText("Selected filters");
  expect(summary).toHaveClass("rescue-portfolio-filter-summary");
  expect(summary).toHaveTextContent(statuses.join(", "));
  expect(summary).toHaveAttribute("title", summary.textContent);
  const trigger = screen.getByRole("button", { name: "Filters" });
  expect(trigger).toHaveAccessibleDescription(
    `${supportedChainIds.length + statuses.length} selected filters`,
  );
  expect(trigger).not.toContainElement(summary);
  fireEvent.click(trigger);
  const dialog = await screen.findByRole("dialog", {
    name: "Filter your orders",
  });
  for (const status of statuses)
    expect(
      within(dialog).getByRole("checkbox", { name: status }),
    ).toBeChecked();
  expect(dialog).toHaveClass("rescue-portfolio-filter-panel");
});

test("shows no availability warning for a healthy account and clears it after Refresh orders recovers", async () => {
  const unavailable = new Set<number>();
  serveOrders([apiParent()], unavailable);
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("row", {
    name: "View order indexed-order on Ethereum",
  });
  expect(
    screen.queryByRole("button", { name: "Order availability warnings" }),
  ).not.toBeInTheDocument();

  unavailable.add(1);
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  const warning = await screen.findByRole("button", {
    name: "Order availability warnings",
  });
  fireEvent.focus(warning);
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Previously loaded Ethereum orders may be out of date.",
  );
  fireEvent.keyDown(warning, { key: "Escape" });
  unavailable.clear();
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Order availability warnings" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
});

test("keeps the expanding table shell while the connected account's first orders are loading", async () => {
  const fetchOrders = global.fetch;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  global.fetch = jest.fn(async (...args) => {
    await pending;
    return fetchOrders(...args);
  });
  render(<TableView />);
  await connectWallet();

  try {
    expect(await screen.findByRole("status")).toHaveTextContent(
      "Loading stop-loss orders...",
    );
    const table = screen.getByRole("table");
    expect(table).toContainElement(screen.getByRole("status"));
    expect(screen.queryByText("No results.")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh orders" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Refresh orders" }),
    ).toHaveAttribute("aria-busy", "true");
    const viewport = screen.getByRole("region", { name: "Table rows" });
    const frame = viewport.parentElement!;
    expect(viewport).toContainElement(table);
    expect(viewport).toHaveClass(
      "min-h-0",
      "min-w-0",
      "flex-1",
      "max-h-none",
      "[&>div]:overflow-visible",
      "[&>div]:h-full",
    );
    expect(viewport).not.toHaveClass("pixel-frame");
    expect(frame).toHaveClass("pixel-frame", "min-h-0", "min-w-0", "flex-1");
    expect(frame.parentElement!.querySelectorAll(".pixel-frame")).toHaveLength(
      1,
    );
    expect(frame.parentElement).toHaveClass(
      "flex",
      "min-h-0",
      "flex-1",
      "flex-col",
    );

    await act(async () => release());
    await screen.findByRole("cell", { name: "No results." });
    expect(screen.getByRole("table")).toBe(table);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Refresh orders" }),
    ).toBeEnabled();
  } finally {
    await act(async () => release());
  }
});

test("keeps an expanding unavailable viewport and retries into the same table without showing an empty account", async () => {
  const unavailable = new Set<number>(supportedChainIds);
  serveOrders([apiParent()], unavailable);
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", {
    name: "Orders are unavailable on all supported chains.",
  });

  const table = screen.getByRole("table");
  expect(table).toContainElement(
    screen.getByText("Orders are unavailable on all supported chains."),
  );
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  const viewport = screen.getByRole("region", { name: "Table rows" });
  expect(viewport).toContainElement(table);
  expect(viewport).toHaveClass(
    "min-h-0",
    "min-w-0",
    "flex-1",
    "max-h-none",
    "[&>div]:overflow-visible",
    "[&>div]:h-full",
  );
  expect(viewport).not.toHaveClass("pixel-frame");
  expect(viewport.parentElement).toHaveClass("pixel-frame");
  expect(screen.getByRole("button", { name: "Refresh orders" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();

  unavailable.delete(1);
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  expect(
    await screen.findByRole("row", {
      name: "View order indexed-order on Ethereum",
    }),
  ).toBeVisible();
  expect(screen.getByRole("table")).toBe(table);
  const warning = screen.getByRole("button", {
    name: "Order availability warnings",
  });
  fireEvent.focus(warning);
  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).not.toHaveTextContent("Ethereum orders are unavailable.");
  expect(tooltip).toHaveTextContent("Gnosis orders are unavailable.");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Orders are unavailable on all supported chains."),
  ).not.toBeInTheDocument();
});

test("keeps chain and placement warnings in a toolbar tooltip with hover, focus and Escape access", async () => {
  const user = userEvent.setup();
  const getItem = Storage.prototype.getItem;
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (
    this: Storage,
    key,
  ) {
    return key === "stop-loss-placement"
      ? '{"version":99,"state":{"records":[]}}'
      : getItem.call(this, key);
  });
  serveOrders([], new Set(supportedChainIds));
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", {
    name: "Orders are unavailable on all supported chains.",
  });

  const warning = await screen.findByRole("button", {
    name: "Order availability warnings",
  });
  const viewport = screen.getByRole("region", { name: "Table rows" });
  const refresh = screen.getByRole("button", { name: "Refresh orders" });
  expect(refresh.closest(".rescue-portfolio-toolbar")).toContainElement(
    warning,
  );
  expect(viewport).not.toContainElement(warning);
  expect(viewport).not.toHaveClass("pixel-frame");
  expect(viewport.parentElement).toHaveClass("pixel-frame");
  expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();

  await user.hover(warning);
  const tooltip = await screen.findByRole("tooltip");
  expect(tooltip).toHaveTextContent(
    "Placement tracking is unavailable. Unsupported placement storage version",
  );
  expect(within(tooltip).getAllByText(/orders are unavailable\./)).toHaveLength(
    supportedChainIds.length,
  );
  expect(tooltip).toHaveTextContent("Use Refresh orders to retry.");
  expect(viewport).not.toContainElement(tooltip);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^Retry / }),
  ).not.toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
  );
  await user.unhover(warning);
  act(() => warning.focus());
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Use Refresh orders to retry.",
  );
  expect(warning).toHaveFocus();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument(),
  );
  expect(warning).toHaveFocus();
  expect(viewport).not.toContainElement(refresh);
  expect(viewport).not.toContainElement(
    screen.getByRole("button", { name: "Filters" }),
  );
  expect(refresh).toBeEnabled();
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
});

test("keeps pagination and availability warnings outside the stationary frame", async () => {
  serveOrders(
    Array.from({ length: 6 }, (_, index) =>
      apiParent(1, `paged-${index}`, `0x${String(index).repeat(64)}`),
    ),
    new Set([100]),
  );
  render(<TableView />);
  await connectWallet();

  const next = await screen.findByRole("button", { name: "Go to next page" });
  const viewport = screen.getByRole("region", { name: "Table rows" });
  const frame = viewport.parentElement!;
  const panel = frame.parentElement!;
  expect(frame).toHaveClass("pixel-frame");
  expect(panel.querySelectorAll(".pixel-frame")).toHaveLength(1);
  expect(viewport).not.toHaveClass("pixel-frame");
  expect(viewport).not.toHaveClass("[&>div]:h-full");
  expect(viewport).not.toContainElement(
    await screen.findByRole("button", { name: "Order availability warnings" }),
  );
  expect(within(viewport).queryByRole("alert")).not.toBeInTheDocument();
  expect(panel).toContainElement(next);
  expect(frame).not.toContainElement(next);
  expect(panel.lastElementChild).toHaveClass("shrink-0");
  expect(panel.lastElementChild).toContainElement(next);
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(5);
  expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();

  fireEvent.click(next);
  await screen.findByText("Page 2 of 2");
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(1);
  expect(
    screen.getByRole("row", { name: "View order paged-5 on Ethereum" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("row", { name: "View order paged-0 on Ethereum" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("region", { name: "Table rows" })).toBe(viewport);
  expect(viewport.parentElement).toBe(frame);
});

test("keeps indexed API orders visible with a tracking error when saved placement storage is unreadable", async () => {
  const getItem = Storage.prototype.getItem;
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (
    this: Storage,
    key,
  ) {
    return key === "stop-loss-placement"
      ? '{"version":99,"state":{"records":[]}}'
      : getItem.call(this, key);
  });
  serveOrders([apiParent(), apiParent(1, "duplicate-event")]);
  render(<TableView />);
  await connectWallet();

  fireEvent.focus(
    await screen.findByRole("button", { name: "Order availability warnings" }),
  );
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Placement tracking is unavailable. Unsupported placement storage version",
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    await screen.findByRole("row", {
      name: "View order indexed-order on Ethereum",
    }),
  ).toBeVisible();
  expect(
    screen.queryByRole("columnheader", { name: "Details" }),
  ).not.toBeInTheDocument();
});

test("shortens API and local amounts without rounding up and retains the full amounts on hover", async () => {
  const indexed = apiParent();
  indexed.decodedParams.sellAmount = "1234567890123456789";
  indexed.decodedParams.buyAmount = "4000123456";
  serveOrders([indexed]);
  const local = prepared();
  local.draft.amountSell = "2.100123456789012345";
  local.draft.amountBuy = "4158.244445";
  local.staticInput = encodeStopLossStaticInput(local.draft, local.appDataHash);
  await confirm(local);
  render(<TableView />);
  await connectWallet();

  const apiAmount = await screen.findByRole("cell", {
    name: "1.2345 WETH for 4000.1234 USDC",
  });
  expect(screen.getByRole("columnheader", { name: "Trigger" })).toBeVisible();
  expect(
    screen.queryByRole("columnheader", { name: "From market" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("columnheader", { name: "Expires" })).toBeVisible();
  const apiRow = apiAmount.closest("tr")!;
  expect(within(apiRow).getByText("2,100 USDC")).toBeVisible();
  expect(
    within(apiRow).queryByText(/(At market|% (below|above) market)/),
  ).not.toBeInTheDocument();
  expect(
    within(apiAmount).getByTitle(
      "1.234567890123456789 WETH for 4000.123456 USDC",
    ),
  ).toBeInTheDocument();
  const localAmount = screen.getByRole("cell", {
    name: "2.1001 WETH for 4158.2444 USDC",
  });
  expect(
    within(localAmount).getByTitle(
      "2.100123456789012345 WETH for 4158.244445 USDC",
    ),
  ).toBeInTheDocument();
});

test.each([
  { status: "Active", validTo: 4102444800, label: "Open", showHint: true },
  {
    status: "Cancelled",
    validTo: 4102444800,
    label: "Cancelled",
    showHint: false,
  },
  { status: "Active", validTo: 1700000000, label: "Expired", showHint: false },
])(
  "shows the market distance hint only for Open orders: $label",
  async ({ status, validTo, label, showHint }) => {
    jest.spyOn(tokenPairPrice, "useTokenPairPrice").mockReturnValue({
      data: 2500,
      error: undefined,
      isLoading: false,
    });
    const order = apiParent();
    serveOrders([
      { ...order, status, decodedParams: { ...order.decodedParams, validTo } },
    ]);
    render(<TableView />);
    await connectWallet();

    const row = await screen.findByRole("row", {
      name: "View order indexed-order on Ethereum",
    });
    expect(within(row).getByRole("cell", { name: label })).toBeInTheDocument();
    expect(within(row).getByText("2,100 USDC")).toBeVisible();
    if (showHint)
      expect(within(row).getByText("16.00% below market")).toBeVisible();
    else {
      expect(
        within(row).queryByText(/(At market|% (below|above) market)/),
      ).not.toBeInTheDocument();
      expect(tokenPairPrice.useTokenPairPrice).not.toHaveBeenCalled();
    }
  },
);

test("distinguishes tiny positive amounts from zero and preserves exact integer and base-unit amounts", async () => {
  const examples = [
    {
      sellAmount: "1",
      buyAmount: "1",
      display: "<0.0001 WETH for <0.0001 USDC",
      full: "0.000000000000000001 WETH for 0.000001 USDC",
    },
    {
      sellAmount: "0",
      buyAmount: "0",
      display: "0 WETH for 0 USDC",
      full: "0 WETH for 0 USDC",
    },
    {
      sellAmount: "100000000000000",
      buyAmount: "100",
      display: "0.0001 WETH for 0.0001 USDC",
      full: "0.0001 WETH for 0.0001 USDC",
    },
    {
      sellAmount: "9007199254740993123400000000000000",
      buyAmount: "2100000001",
      display: "9007199254740993.1234 WETH for 2100 USDC",
      full: "9007199254740993.1234 WETH for 2100.000001 USDC",
    },
    {
      sellAmount: "9007199254740993123456789",
      buyAmount: "123456789",
      sellToken: "0x7777777777777777777777777777777777777777",
      buyToken: "0x8888888888888888888888888888888888888888",
      display:
        "9007199254740993123456789 base units Unknown token for 123456789 base units Unknown token",
      full: "9007199254740993123456789 base units Unknown token for 123456789 base units Unknown token",
    },
  ];
  serveOrders(
    examples.map((example, index) => {
      const order = apiParent(
        1,
        `amount-${index}`,
        `0x${String(index).repeat(64)}`,
      );
      return {
        ...order,
        decodedParams: {
          ...order.decodedParams,
          sellAmount: example.sellAmount,
          buyAmount: example.buyAmount,
          sellToken: example.sellToken ?? order.decodedParams.sellToken,
          buyToken: example.buyToken ?? order.decodedParams.buyToken,
        },
      };
    }),
  );
  render(<TableView />);
  await connectWallet();

  for (const example of examples) {
    const cell = await screen.findByRole("cell", { name: example.display });
    expect(within(cell).getByTitle(example.full)).toBeInTheDocument();
  }
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();
});

test("shows a pending setup stage and its RPC error on the unindexed row", async () => {
  const order = prepared();
  await writer.submit(order, "setup", {
    send: async () => ({ id: "pending-reference" }),
  });
  await writer.resume(order, {
    checkState: async () => {
      throw new Error("RPC unavailable");
    },
  });
  render(<TableView />);
  await connectWallet();

  const row = (
    await screen.findByRole("cell", { name: "1 WETH for 1980 USDC" })
  ).closest("tr")!;
  expect(within(row).getByText("Pending")).toBeInTheDocument();
  expect(within(row).getByText("Setup pending")).toBeInTheDocument();
  expect(within(row).getByText("RPC unavailable")).toBeInTheDocument();
  expect(within(row).queryByRole("link")).not.toBeInTheDocument();
});

test("keeps approvals and the setup wallet prompt out of the table until setup is signed", async () => {
  const order = prepared();
  const placement = writer;
  const send = async () => ({ id: "approval-reference" });
  await placement.submit(order, "approval-reset", { send });
  render(<TableView />);
  await connectWallet();
  const expectNoOrder = () => {
    expect(
      screen.queryByRole("cell", { name: "1 WETH for 1980 USDC" }),
    ).not.toBeInTheDocument();
  };
  expectNoOrder();

  await act(async () => {
    await placement.resume(order, {
      readTransaction: async () => ({ status: "success" }),
      checkState: async () => true,
    });
    await placement.submit(order, "approval", {
      approvalAmount: BigInt(3),
      send,
    });
  });
  expectNoOrder();
  await act(async () => {
    await placement.resume(order, {
      readTransaction: async () => ({ status: "success" }),
      checkState: async () => true,
    });
  });
  expectNoOrder();

  let release!: (reference: { id: string }) => void;
  const walletResponse = new Promise<{ id: string }>((resolve) => {
    release = resolve;
  });
  let submission!: ReturnType<typeof placement.submit>;
  await act(async () => {
    submission = placement.submit(order, "setup", {
      send: async () => walletResponse,
    });
  });
  try {
    expectNoOrder();
  } finally {
    await act(async () => {
      release({ id: "setup-reference" });
      await submission;
    });
  }
  const cell = await screen.findByRole("cell", {
    name: "1 WETH for 1980 USDC",
  });
  const row = cell.closest("tr")!;
  expect(within(row).getByText("Pending")).toBeInTheDocument();
  expect(within(row).getByText("Setup pending")).toBeInTheDocument();
  expect(within(row).queryByRole("link")).not.toBeInTheDocument();
});

test("refreshes every fifteen seconds until a canonical API replacement is shown, then returns to manual refresh", async () => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  await confirm();
  const orders: ReturnType<typeof apiParent>[] = [];
  serveOrders(orders);
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "1 WETH for 1980 USDC" });

  orders.push(apiParent(100, "indexed-replacement", `0x${"BB".repeat(32)}`));
  orders.push(apiParent(100, "duplicate-event", `0x${"bb".repeat(32)}`));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(14000);
  });
  expect(
    screen.queryByRole("row", { name: /indexed-replacement/ }),
  ).not.toBeInTheDocument();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1000);
  });
  expect(
    await screen.findByRole("row", {
      name: "View order indexed-replacement on Gnosis",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("cell", { name: "1 WETH for 1980 USDC" }),
  ).not.toBeInTheDocument();
  expect(screen.getAllByRole("row", { name: /^View order/ })).toHaveLength(1);

  orders.push(apiParent(1, "later-order"));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60000);
  });
  expect(
    screen.queryByRole("row", { name: /later-order/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  expect(
    await screen.findByRole("row", {
      name: "View order later-order on Ethereum",
    }),
  ).toBeInTheDocument();
});

test("shows the five-minute API error on an Open row even while an API request is stuck", async () => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  const confirmedAt = Date.now();
  await confirm();
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "1 WETH for 1980 USDC" });

  const fetchOrders = global.fetch;
  let release!: () => void;
  const unavailable = new Promise<void>((resolve) => {
    release = resolve;
  });
  global.fetch = jest.fn(async (...args) => {
    await unavailable;
    return fetchOrders(...args);
  });
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  try {
    await act(async () => {
      await jest.advanceTimersByTimeAsync(confirmedAt + 299999 - Date.now());
    });
    expect(
      screen.queryByText("API error: confirmed order not found."),
    ).not.toBeInTheDocument();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1);
    });
    const row = screen
      .getByRole("cell", { name: "1 WETH for 1980 USDC" })
      .closest("tr")!;
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "API error: confirmed order not found.",
    );
    expect(within(row).getByText("Open")).toBeInTheDocument();
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
  } finally {
    await act(async () => {
      release();
    });
  }
});

test("restores an old confirmed Open row and its API error before the first API response", async () => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  await confirm();
  await jest.advanceTimersByTimeAsync(300000);
  const fetchOrders = global.fetch;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  global.fetch = jest.fn(async (...args) => {
    await pending;
    return fetchOrders(...args);
  });
  render(<TableView />);
  await connectWallet();
  try {
    const amount = await screen.findByRole("cell", {
      name: "1 WETH for 1980 USDC",
    });
    const row = amount.closest("tr")!;
    expect(within(row).getByText("Open")).toBeInTheDocument();
    expect(within(row).getByRole("alert")).toHaveTextContent(
      "API error: confirmed order not found.",
    );
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
  } finally {
    await act(async () => {
      release();
    });
  }
});

test("groups pending placements and active API orders under the Open filter", async () => {
  await writer.submit(prepared(), "setup", {
    send: async () => ({ id: "pending-reference" }),
  });
  serveOrders([apiParent()]);
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "1 WETH for 1980 USDC" });
  await screen.findByRole("row", {
    name: "View order indexed-order on Ethereum",
  });
  fireEvent.click(screen.getByRole("button", { name: "Filters" }));
  const filterPanel = await screen.findByRole("dialog", {
    name: "Filter your orders",
  });
  fireEvent.click(within(filterPanel).getByRole("checkbox", { name: "Open" }));
  fireEvent.keyDown(filterPanel, { key: "Escape" });
  await waitFor(() =>
    expect(
      screen.queryByRole("dialog", { name: "Filter your orders" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole("cell", { name: "1 WETH for 1980 USDC" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
  expect(new URLSearchParams(window.location.search).get("status")).toBe(
    "Open",
  );
});

test("keeps last-good failed-chain orders beside a local Open row and clears its timeout after indexing", async () => {
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  await confirm();
  const orders = [apiParent()];
  const unavailable = new Set<number>();
  serveOrders(orders, unavailable);
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("row", {
    name: "View order indexed-order on Ethereum",
  });
  unavailable.add(1);
  unavailable.add(100);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(300000);
  });
  fireEvent.focus(
    await screen.findByRole("button", { name: "Order availability warnings" }),
  );
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    "Previously loaded Ethereum orders may be out of date.",
  );
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
  const row = screen
    .getByRole("cell", { name: "1 WETH for 1980 USDC" })
    .closest("tr")!;
  expect(within(row).getByText("Open")).toBeInTheDocument();
  expect(within(row).getByRole("alert")).toHaveTextContent(
    "API error: confirmed order not found.",
  );

  unavailable.delete(100);
  orders.push(apiParent(100, "late-indexed-order", `0x${"bb".repeat(32)}`));
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  expect(
    await screen.findByRole("row", {
      name: "View order late-indexed-order on Gnosis",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("API error: confirmed order not found."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("columnheader", { name: "Details" }),
  ).not.toBeInTheDocument();
});

test("clears local rows on account changes and ignores the old account's late API results", async () => {
  await confirm();
  const otherOrder = prepared(42161, otherAccount);
  otherOrder.draft.amountSell = "3";
  otherOrder.draft.amountBuy = "5940";
  otherOrder.staticInput = encodeStopLossStaticInput(
    otherOrder.draft,
    otherOrder.appDataHash,
  );
  await confirm(otherOrder);
  const fetchOrders = global.fetch;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  global.fetch = jest.fn(async (...args) => {
    const { variables } = JSON.parse(args[1]?.body as string);
    if (variables.wallet === account) await pending;
    return fetchOrders(...args);
  });
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "1 WETH for 1980 USDC" });
  try {
    await act(async () => {
      provider.accounts = [otherAccount];
      provider.emit("accountsChanged", [otherAccount]);
    });
    await screen.findByTitle(otherAccount);
    expect(
      screen.queryByRole("cell", { name: "1 WETH for 1980 USDC" }),
    ).not.toBeInTheDocument();
    const amount = await screen.findByRole("cell", {
      name: "3 WETH for 5940 USDC",
    });
    expect(
      within(amount.closest("tr")!).getByText("Arbitrum"),
    ).toBeInTheDocument();
    await act(async () => {
      release();
    });
    expect(
      screen.queryByRole("cell", { name: "1 WETH for 1980 USDC" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("cell", { name: "3 WETH for 5940 USDC" }),
    ).toBeInTheDocument();
  } finally {
    await act(async () => {
      release();
    });
  }
});

test("shows confirmed local Open rows on all supported chains without detail links", async () => {
  for (const chainId of [1, 100, 42161, 11155111] as const) {
    await confirm(prepared(chainId));
  }
  await confirm(prepared(42161, otherAccount));
  serveOrders([apiParent()]);
  render(<TableView />);
  await connectWallet();

  await screen.findAllByRole("cell", { name: "1 WETH for 1980 USDC" });
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
  const seen = new Set<string>();
  const amounts = screen.getAllByRole("cell", {
    name: "1 WETH for 1980 USDC",
  });
  expect(amounts).toHaveLength(4);
  for (const amount of amounts) {
    const row = amount.closest("tr")!;
    expect(within(row).getByText("Open")).toBeInTheDocument();
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
    for (const chain of [
      "Ethereum",
      "Gnosis",
      "Arbitrum",
      "Sepolia (testnet)",
    ]) {
      if (within(row).queryByText(chain)) seen.add(chain);
    }
  }
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();
  expect([...seen].sort()).toEqual([
    "Arbitrum",
    "Ethereum",
    "Gnosis",
    "Sepolia (testnet)",
  ]);
});
