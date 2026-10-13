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
let previousLock = Promise.resolve();
const locks = {
  request<T>(_name: string, action: () => T | Promise<T>) {
    const result = previousLock.then(action);
    previousLock = result.then(
      () => undefined,
      () => undefined,
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
    await screen.findByRole("link", {
      name: "View order indexed-order on Ethereum",
    }),
  ).toHaveAttribute("href", `/1/${account}/indexed-order`);
  expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(1);
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
    await placement.resume(order, { checkState: async () => true });
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
    await placement.resume(order, { checkState: async () => true });
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
    await screen.findByRole("link", {
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
    await screen.findByRole("link", {
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
  await screen.findByRole("link", {
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
  await screen.findByRole("link", {
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
    screen.getByRole("link", { name: "View order indexed-order on Ethereum" }),
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
    await screen.findByRole("link", {
      name: "View order late-indexed-order on Gnosis",
    }),
  ).toBeInTheDocument();
  expect(
    screen.queryByText("API error: confirmed order not found."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(2);
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
    screen.getByRole("link", { name: "View order indexed-order on Ethereum" }),
  ).toBeInTheDocument();
});
