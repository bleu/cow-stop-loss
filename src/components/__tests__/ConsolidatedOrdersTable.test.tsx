/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
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

import { ConsolidatedOrdersTable } from "#/components/ConsolidatedOrdersTable";
import { RootLayout } from "#/components/RootLayout";
import { getStopLossPlacement } from "#/hooks/useStopLossPlacement";
import type { PreparedPlacement } from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
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

function TableView() {
  const [url, setUrl] = React.useState(new URL("http://localhost/"));
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
  localStorage.clear();
  writer = createStopLossPlacement({ locks, now: () => new Date().getTime() });
  stopWriter = writer.subscribe(() =>
    window.dispatchEvent(
      new StorageEvent("storage", { key: "stop-loss-placement" }),
    ),
  );
  window.history.replaceState(null, "", "/");
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
  await screen.findByText("Waiting for API indexing");
  expect(
    screen.queryByRole("link", { name: /^View order/ }),
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

  expect(window.location.pathname).toBe("/");
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
  expect(window.location.pathname).toBe("/");
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
  await within(dialog).findByText("Order cancelled.", {}, { timeout: 4000 });
  fireEvent.click(within(dialog).getAllByRole("button", { name: "Close" })[0]);
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

test("fills the empty orders viewport without putting filters or pagination in its scroll area", async () => {
  render(<TableView />);
  await connectWallet();
  await screen.findByRole("cell", { name: "No results." });

  const table = screen.getByRole("table");
  const viewport = table.parentElement!.parentElement!;
  const panel = viewport.parentElement!;
  expect(panel).toHaveClass("flex", "h-full", "min-h-0", "flex-1", "flex-col");
  expect(viewport).toHaveClass(
    "min-h-0",
    "flex-1",
    "max-h-none",
    "overflow-auto",
    "[&>div]:overflow-visible",
    "[&>div]:h-full",
  );
  expect(viewport).not.toHaveClass("max-h-96");
  expect(table).toHaveClass("h-full");
  expect(table.querySelector("thead")).toHaveClass(
    "sticky",
    "top-0",
    "z-10",
    "bg-background",
  );
  expect(panel.firstElementChild).toHaveClass("shrink-0");
  expect(panel.firstElementChild).toContainElement(
    screen.getByRole("button", { name: "Refresh orders" }),
  );
  expect(panel.lastElementChild).toBe(viewport);
  expect(
    screen.queryByRole("button", { name: "Go to next page" }),
  ).not.toBeInTheDocument();
  const chainFilter = screen.queryByRole("button", { name: "Chain" });
  if (chainFilter) expect(viewport).not.toContainElement(chainFilter);
  expect(screen.queryByText("Rows per page")).not.toBeInTheDocument();
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
    const viewport = table.parentElement!.parentElement!;
    expect(viewport).toHaveClass("min-h-0", "flex-1", "max-h-none");
    expect(viewport.parentElement!.parentElement).toHaveClass(
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
  const unavailable = new Set([1, 100, 42161, 11155111]);
  serveOrders([apiParent()], unavailable);
  render(<TableView />);
  await connectWallet();
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(4));

  const table = screen.getByRole("table");
  expect(table).toContainElement(
    screen.getByText("Orders are unavailable on all supported chains."),
  );
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  expect(table.parentElement!.parentElement).toHaveClass(
    "min-h-0",
    "flex-1",
    "max-h-none",
  );
  expect(screen.getByRole("button", { name: "Refresh orders" })).toBeEnabled();
  expect(
    screen.getByRole("button", { name: "Go to next page" }),
  ).toBeDisabled();

  unavailable.delete(1);
  fireEvent.click(screen.getByRole("button", { name: "Retry Ethereum" }));
  expect(
    await screen.findByRole("row", {
      name: "View order indexed-order on Ethereum",
    }),
  ).toBeVisible();
  expect(screen.getByRole("table")).toBe(table);
  expect(screen.getAllByRole("alert")).toHaveLength(3);
  expect(
    screen.queryByText("Orders are unavailable on all supported chains."),
  ).not.toBeInTheDocument();
});

test("keeps chain and placement warnings inside the scroll area so pagination remains outside", async () => {
  const getItem = Storage.prototype.getItem;
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (
    this: Storage,
    key,
  ) {
    return key === "stop-loss-placement"
      ? '{"version":2,"state":{"records":[]}}'
      : getItem.call(this, key);
  });
  serveOrders([], new Set([1, 100, 42161, 11155111]));
  render(<TableView />);
  await connectWallet();
  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(5));

  const viewport = screen.getByRole("table").parentElement!.parentElement!;
  for (const warning of screen.getAllByRole("alert")) {
    expect(viewport).toContainElement(warning);
  }
  expect(viewport).not.toContainElement(
    screen.getByRole("button", { name: "Refresh orders" }),
  );
  expect(viewport).not.toContainElement(
    screen.getByRole("button", { name: "Go to next page" }),
  );
  expect(screen.getByRole("button", { name: "Retry Ethereum" })).toBeEnabled();
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
});

test("keeps indexed API orders visible with a tracking error when saved placement storage is unreadable", async () => {
  const getItem = Storage.prototype.getItem;
  jest.spyOn(Storage.prototype, "getItem").mockImplementation(function (
    this: Storage,
    key,
  ) {
    return key === "stop-loss-placement"
      ? '{"version":2,"state":{"records":[]}}'
      : getItem.call(this, key);
  });
  serveOrders([apiParent(), apiParent(1, "duplicate-event")]);
  render(<TableView />);
  await connectWallet();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Placement tracking is unavailable. Unsupported placement storage version",
  );
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

test("shows each approval stage and the setup wallet prompt without offering an API link", async () => {
  const order = prepared();
  const placement = writer;
  const send = async () => ({ id: "approval-reference" });
  await placement.submit(order, "approval-reset", { send });
  render(<TableView />);
  await connectWallet();
  expect(await screen.findByText("Approval reset pending")).toBeInTheDocument();

  await act(async () => {
    await placement.resume(order, {
      readTransaction: async () => ({ status: "success" }),
      checkState: async () => true,
    });
  });
  expect(
    await screen.findByText("Approval reset confirmed. Approval required."),
  ).toBeInTheDocument();
  await act(async () => {
    await placement.submit(order, "approval", {
      approvalAmount: BigInt(3),
      send,
    });
  });
  expect(await screen.findByText("Approval pending")).toBeInTheDocument();
  await act(async () => {
    await placement.resume(order, {
      readTransaction: async () => ({ status: "success" }),
      checkState: async () => true,
    });
  });
  expect(
    await screen.findByText("Approval confirmed. Ready to place."),
  ).toBeInTheDocument();

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
    expect(
      await screen.findByText("Waiting for wallet: setup"),
    ).toBeInTheDocument();
    const row = screen
      .getByRole("cell", { name: "1 WETH for 1980 USDC" })
      .closest("tr")!;
    expect(within(row).getByText("Pending")).toBeInTheDocument();
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
  } finally {
    await act(async () => {
      release({ id: "setup-reference" });
      await submission;
    });
  }
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
    screen.queryByRole("link", { name: /indexed-replacement/ }),
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
  expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(1);

  orders.push(apiParent(1, "later-order"));
  await act(async () => {
    await jest.advanceTimersByTimeAsync(60000);
  });
  expect(
    screen.queryByRole("link", { name: /later-order/ }),
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

test("filters pending local placements separately from Open API orders", async () => {
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
  fireEvent.click(screen.getByRole("button", { name: "Status" }));
  fireEvent.click(await screen.findByRole("option", { name: "Pending" }));

  await waitFor(() =>
    expect(
      screen.queryByRole("link", { name: /^View order/ }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.getByRole("cell", { name: "1 WETH for 1980 USDC" }),
  ).toBeInTheDocument();
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
  expect(
    await screen.findByText(
      "Previously loaded Ethereum orders may be out of date.",
    ),
  ).toBeInTheDocument();
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
  fireEvent.click(screen.getByRole("button", { name: "Retry Gnosis" }));
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
      within(amount.closest("tr")!).getByRole("cell", { name: "Arbitrum" }),
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

  const amounts = await screen.findAllByRole("cell", {
    name: "1 WETH for 1980 USDC",
  });
  expect(amounts).toHaveLength(4);
  for (const chain of ["Ethereum", "Gnosis", "Arbitrum", "Sepolia (testnet)"]) {
    const row = amounts
      .map((amount) => amount.closest("tr")!)
      .find((candidate) =>
        within(candidate).queryByRole("cell", { name: chain }),
      )!;
    expect(within(row).getByRole("cell", { name: "Open" })).toBeInTheDocument();
    expect(within(row).queryByRole("link")).not.toBeInTheDocument();
  }
  expect(
    screen.getByRole("row", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
});
