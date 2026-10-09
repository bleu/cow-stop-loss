/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import {
  act,
  fireEvent,
  render as renderView,
  screen,
  waitFor,
} from "@testing-library/react";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { EventEmitter } from "events";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import {
  PathnameContext,
  SearchParamsContext,
} from "next/dist/shared/lib/hooks-client-context.shared-runtime";
import React from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { disconnect } from "wagmi/actions";

import OrderPage from "#/app/[chainId]/[safeAddress]/[orderId]/page";
import LegacyListPage from "#/app/[chainId]/[safeAddress]/page";
import HomePage from "#/app/page";
import { RootLayout as AppRootLayout } from "#/components/RootLayout";
import { createWagmiConfig } from "#/utils/wagmi";

let config: ReturnType<typeof createWagmiConfig>;
function RootLayout({ children }: React.PropsWithChildren) {
  return <AppRootLayout config={config}>{children}</AppRootLayout>;
}

const wallet = "0x1111111111111111111111111111111111111111";
const originalFetch = global.fetch;
const parent = {
  eventId: "stop-loss-1",
  chainId: 1,
  owner: wallet,
  resolvedOwner: wallet,
  status: "Active",
  orderType: "StopLoss",
  handler: "0x412c36e5011cd2517016d243a2dfb37f73a242e7",
  hash: `0x${"ab".repeat(32)}`,
  transaction: { hash: `0x${"ef".repeat(32)}`, blockTimestamp: "1700000000" },
  decodedParams: {
    sellToken: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    buyToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    sellAmount: "1000000000000000000",
    buyAmount: "2000000000",
    receiver: wallet,
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

type ApiParent = Omit<typeof parent, "discreteOrders"> & {
  discreteOrders: {
    items: {
      orderUid: string;
      status: string;
      validTo: number;
      executedSellAmount: string | null;
      executedBuyAmount: string | null;
      executedFee: string | null;
    }[];
  };
};

function serveOrders(
  orders: ApiParent[],
  unavailableChains = new Set<number>(),
) {
  global.fetch = jest.fn(async (_url, init) => {
    const { query, variables } = JSON.parse(init?.body as string);
    if (unavailableChains.has(variables.chain))
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

function Router({ children }: React.PropsWithChildren) {
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
      back: () => {},
      forward: () => {},
      refresh: () => {},
      prefetch: () => {},
    }),
    [],
  );
  return (
    <AppRouterContext.Provider value={router}>
      <PathnameContext.Provider value={url.pathname}>
        <SearchParamsContext.Provider value={url.searchParams}>
          {children}
        </SearchParamsContext.Provider>
      </PathnameContext.Provider>
    </AppRouterContext.Provider>
  );
}

function render(view: React.ReactNode) {
  return renderView(<Router>{view}</Router>);
}

async function connectBrowserWallet() {
  fireEvent.click(
    await screen.findByRole("button", { name: "Connect wallet" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Browser wallet" }),
  );
  await screen.findByTitle(wallet);
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
}

beforeAll(() => {
  Object.assign(globalThis, {
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  Element.prototype.scrollIntoView = () => {};
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  config = createWagmiConfig();
  serveOrders([]);
});

class BrowserWallet extends EventEmitter {
  accounts = [wallet];
  chainId = 1;
  rejectSwitch = false;

  async request({ method, params }: { method: string; params?: unknown[] }) {
    if (method === "wallet_switchEthereumChain") {
      if (this.rejectSwitch)
        throw Object.assign(new Error("User rejected the request."), {
          code: 4001,
        });
      this.chainId = Number((params?.[0] as { chainId: string }).chainId);
      this.emit("chainChanged", `0x${this.chainId.toString(16)}`);
      return null;
    }
    if (method === "eth_requestAccounts" || method === "eth_accounts")
      return this.accounts;
    if (method === "eth_chainId") return `0x${this.chainId.toString(16)}`;
    if (method === "wallet_requestPermissions")
      return [{ parentCapability: "eth_accounts" }];
    if (method === "wallet_revokePermissions") return null;
    throw new Error(`Unexpected wallet request: ${method}`);
  }
}

afterEach(async () => {
  jest.useRealTimers();
  await act(async () => {
    await disconnect(config);
  });
  global.fetch = originalFetch;
  Reflect.deleteProperty(window, "ethereum");
  localStorage.clear();
  jest.restoreAllMocks();
});

test("hydrates the wallet header before showing browser-discovered wallets", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const view = (walletConfig: typeof config) => (
    <Router>
      <AppRootLayout config={walletConfig}>
        <HomePage />
      </AppRootLayout>
    </Router>
  );
  container.innerHTML = renderToString(view(config));

  const provider = new BrowserWallet();
  provider.accounts = [];
  provider.chainId = 137;
  const request = jest.spyOn(provider, "request");
  const announceWallet = () => {
    window.dispatchEvent(
      new CustomEvent("eip6963:announceProvider", {
        detail: {
          info: {
            uuid: "9be2a2b0-6cb1-4690-aad2-11d392e07713",
            name: "Discovered browser wallet",
            icon: "data:image/svg+xml;base64,PHN2Zy8+",
            rdns: "test.wallet",
          },
          provider,
        },
      }),
    );
  };
  window.addEventListener("eip6963:requestProvider", announceWallet);
  const hydrationError = jest.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    config = createWagmiConfig();
    await act(async () => {
      root = hydrateRoot(container, view(config), {
        onRecoverableError: hydrationError,
      });
    });

    fireEvent.click(
      await screen.findByRole("button", { name: "Connect wallet" }),
    );
    expect(
      await screen.findByRole("button", { name: "Discovered browser wallet" }),
    ).toBeInTheDocument();
    provider.accounts = [wallet];
    fireEvent.click(
      screen.getByRole("button", { name: "Discovered browser wallet" }),
    );
    expect(await screen.findByTitle(wallet)).toBeInTheDocument();
    expect(provider.chainId).toBe(137);
    expect(request).not.toHaveBeenCalledWith(
      expect.objectContaining({ method: "wallet_switchEthereumChain" }),
    );
    expect(hydrationError).not.toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    window.removeEventListener("eip6963:requestProvider", announceWallet);
    container.remove();
  }
});

test("opens without a Safe frame and asks users to connect a wallet", async () => {
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );

  expect(
    await screen.findByText("Connect a wallet to view your stop-loss orders."),
  ).toBeInTheDocument();
});

test("shows a connected wallet's untriggered order with a read-only detail link", async () => {
  serveOrders([parent]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );

  await connectBrowserWallet();

  expect(
    await screen.findByRole("link", {
      name: "View order stop-loss-1 on Ethereum",
    }),
  ).toHaveAttribute("href", `/1/${wallet}/stop-loss-1`);
  expect(
    screen.queryByRole("button", { name: /Create|Review|Cancel/ }),
  ).not.toBeInTheDocument();
});

test("keeps the legacy list route read-only and scoped to the connected account", async () => {
  serveOrders([parent]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <LegacyListPage
        params={{
          chainId: 100,
          safeAddress: "0x2222222222222222222222222222222222222222",
        }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("link", {
      name: "View order stop-loss-1 on Ethereum",
    }),
  ).toHaveAttribute("href", `/1/${wallet}/stop-loss-1`);
  expect(
    screen.getByRole("heading", { name: "Your stop-loss orders" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Create|Review|Cancel/ }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("Pending transactions")).not.toBeInTheDocument();
});

test("combines all four chains and filters Sepolia as a testnet without switching the wallet", async () => {
  serveOrders(
    [1, 100, 42161, 11155111].map((chainId) => ({ ...parent, chainId })),
  );
  const provider = new BrowserWallet();
  const request = jest.spyOn(provider, "request");
  provider.chainId = 137;
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findAllByRole("link", { name: /^View order/ }),
  ).toHaveLength(4);
  fireEvent.click(screen.getByRole("button", { name: "Chain" }));
  fireEvent.click(
    await screen.findByRole("option", { name: "Sepolia (testnet)" }),
  );

  await waitFor(() =>
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      1,
    ),
  );
  expect(
    screen.getByRole("link", {
      name: "View order stop-loss-1 on Sepolia (testnet)",
    }),
  ).toHaveAttribute("href", `/11155111/${wallet}/stop-loss-1`);
  expect(provider.chainId).toBe(137);
  expect(request).not.toHaveBeenCalledWith(
    expect.objectContaining({ method: "wallet_switchEthereumChain" }),
  );
});

test("switches the wallet network only through the header and keeps all chains visible", async () => {
  serveOrders(
    [1, 100, 42161, 11155111].map((chainId) => ({ ...parent, chainId })),
  );
  const provider = new BrowserWallet();
  const request = jest.spyOn(provider, "request");
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByTitle(wallet);
  await waitFor(() =>
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      4,
    ),
  );
  expect(request).not.toHaveBeenCalledWith(
    expect.objectContaining({ method: "wallet_switchEthereumChain" }),
  );

  fireEvent.click(
    screen.getByRole("button", { name: "Switch wallet network" }),
  );
  expect(
    await screen.findByRole("button", { name: /Ethereum/ }),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Gnosis/ })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /Arbitrum/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Sepolia \(testnet\)/ }));

  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Switch wallet network" }),
    ).toHaveTextContent("Sepolia (testnet)"),
  );
  expect(provider.chainId).toBe(11155111);
  expect(request).toHaveBeenCalledWith(
    expect.objectContaining({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0xaa36a7" }],
    }),
  );
  expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(4);
});

test("keeps account access and orders when a wallet network switch is rejected", async () => {
  serveOrders([parent]);
  const provider = new BrowserWallet();
  provider.rejectSwitch = true;
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", {
    name: "View order stop-loss-1 on Ethereum",
  });
  fireEvent.click(
    screen.getByRole("button", { name: "Switch wallet network" }),
  );
  fireEvent.click(await screen.findByRole("button", { name: /Gnosis/ }));
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );

  expect(
    screen.getByRole("button", { name: "Switch wallet network" }),
  ).toHaveTextContent("Ethereum");
  expect(screen.getByTitle(wallet)).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "View order stop-loss-1 on Ethereum" }),
  ).toBeInTheDocument();
  expect(provider.chainId).toBe(1);
});

test("selects All by default and clears each filter without clearing the other", async () => {
  serveOrders([
    parent,
    { ...parent, chainId: 100 },
    { ...parent, eventId: "cancelled-order", status: "Cancelled" },
  ]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", { name: "View order stop-loss-1 on Gnosis" });

  fireEvent.click(screen.getByRole("button", { name: /^Status/ }));
  expect(await screen.findByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  fireEvent.click(screen.getByRole("option", { name: "Open" }));
  expect(screen.getByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  fireEvent.keyDown(screen.getByPlaceholderText("Status"), { key: "Escape" });
  await waitFor(() =>
    expect(
      screen.queryByRole("option", { name: "All" }),
    ).not.toBeInTheDocument(),
  );

  fireEvent.click(screen.getByRole("button", { name: /^Chain/ }));
  expect(await screen.findByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  fireEvent.click(screen.getByRole("option", { name: "Ethereum" }));
  expect(screen.getByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "false",
  );
  await waitFor(() =>
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      1,
    ),
  );
  fireEvent.click(screen.getByRole("option", { name: "All" }));
  expect(screen.getByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await waitFor(() => {
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      2,
    );
    expect(new URLSearchParams(window.location.search).has("chainId")).toBe(
      false,
    );
    expect(new URLSearchParams(window.location.search).get("status")).toBe(
      "open",
    );
  });
  fireEvent.click(screen.getByRole("option", { name: "Ethereum" }));
  fireEvent.keyDown(screen.getByPlaceholderText("Chain"), { key: "Escape" });
  await waitFor(() =>
    expect(
      screen.queryByRole("option", { name: "All" }),
    ).not.toBeInTheDocument(),
  );

  fireEvent.click(screen.getByRole("button", { name: /^Status/ }));
  fireEvent.click(await screen.findByRole("option", { name: "All" }));
  expect(screen.getByRole("option", { name: "All" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await waitFor(() => {
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      2,
    );
    expect(new URLSearchParams(window.location.search).has("status")).toBe(
      false,
    );
    expect(new URLSearchParams(window.location.search).get("chainId")).toBe(
      "1",
    );
  });
});

test("shows distinct partial terminal states and filters them separately", async () => {
  serveOrders([
    parent,
    ...["cancelled", "expired"].map((status) => ({
      ...parent,
      eventId: `partial-${status}`,
      discreteOrders: {
        items: [
          {
            orderUid: `0x${"cd".repeat(56)}`,
            status,
            validTo: 4102444800,
            executedSellAmount: "500000000000000000",
            executedBuyAmount: "1000000000",
            executedFee: "0",
          },
        ],
      },
    })),
  ]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("cell", { name: "Partially filled, cancelled" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("cell", { name: "Partially filled, expired" }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(3);
  fireEvent.click(screen.getByRole("button", { name: "Status" }));
  fireEvent.click(
    await screen.findByRole("option", { name: "Partially filled, expired" }),
  );

  await waitFor(() =>
    expect(screen.getAllByRole("link", { name: /^View order/ })).toHaveLength(
      1,
    ),
  );
  expect(
    screen.getByRole("link", {
      name: "View order partial-expired on Ethereum",
    }),
  ).toBeInTheDocument();
});

test("keeps successful chains visible and retries a failed chain", async () => {
  const unavailable = new Set([100]);
  serveOrders([parent, { ...parent, chainId: 100 }], unavailable);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("link", {
      name: "View order stop-loss-1 on Ethereum",
    }),
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Gnosis orders are unavailable.",
  );
  unavailable.delete(100);
  fireEvent.click(screen.getByRole("button", { name: "Retry Gnosis" }));
  expect(
    screen.getByRole("link", { name: "View order stop-loss-1 on Ethereum" }),
  ).toBeInTheDocument();

  expect(
    await screen.findByRole("link", {
      name: "View order stop-loss-1 on Gnosis",
    }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

test("does not show an API outage as an empty order list", async () => {
  serveOrders([], new Set([1, 100, 42161, 11155111]));
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();

  await waitFor(() => expect(screen.getAllByRole("alert")).toHaveLength(4));
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
  expect(
    screen.getByText("Orders are unavailable on all supported chains."),
  ).toBeInTheDocument();
});

test("updates orders only after manual refresh, not on focus, reconnect or time", async () => {
  const orders = [parent];
  serveOrders(orders);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", {
    name: "View order stop-loss-1 on Ethereum",
  });

  orders.push({ ...parent, eventId: "later-order" });
  jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  try {
    await act(async () => {
      window.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("online"));
      await jest.advanceTimersByTimeAsync(60000);
    });
    expect(
      screen.queryByRole("link", {
        name: "View order later-order on Ethereum",
      }),
    ).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }

  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));
  expect(
    await screen.findByRole("link", {
      name: "View order later-order on Ethereum",
    }),
  ).toBeInTheDocument();
});

test("uses an icon-only reload control and disables it while orders refresh", async () => {
  serveOrders([parent]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", {
    name: "View order stop-loss-1 on Ethereum",
  });

  const fetchOrders = global.fetch;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  global.fetch = jest.fn(async (...args) => {
    await pending;
    return fetchOrders(...args);
  });
  const reload = screen.getByRole("button", { name: "Refresh orders" });
  fireEvent.click(reload);
  try {
    await waitFor(() => expect(reload).toBeDisabled());
    expect(reload.textContent).toBe("");
    expect(screen.queryByText("Refreshing orders...")).not.toBeInTheDocument();
  } finally {
    await act(async () => release());
  }
  await waitFor(() => expect(reload).toBeEnabled());
});

test("keeps this account's last loaded orders with a warning when refresh fails", async () => {
  const unavailable = new Set<number>();
  serveOrders([parent], unavailable);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", {
    name: "View order stop-loss-1 on Ethereum",
  });

  [1, 100, 42161, 11155111].forEach((chain) => unavailable.add(chain));
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));

  expect(
    await screen.findByText(
      "Previously loaded Ethereum orders may be out of date.",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "View order stop-loss-1 on Ethereum" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("No results.")).not.toBeInTheDocument();
});

test("clears orders on account changes and disconnect, and fetches again when an account returns", async () => {
  const second = "0x2222222222222222222222222222222222222222";
  const orders = [
    parent,
    {
      ...parent,
      eventId: "other-wallet",
      owner: second,
      resolvedOwner: second,
    },
  ];
  serveOrders(orders);
  const provider = new BrowserWallet();
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByRole("link", {
    name: "View order stop-loss-1 on Ethereum",
  });

  await act(async () => {
    provider.accounts = [second];
    provider.emit("accountsChanged", [second]);
  });
  await screen.findByTitle(second);
  expect(
    screen.queryByRole("link", { name: "View order stop-loss-1 on Ethereum" }),
  ).not.toBeInTheDocument();
  await screen.findByRole("link", {
    name: "View order other-wallet on Ethereum",
  });

  orders.push({ ...parent, eventId: "after-return" });
  await act(async () => {
    provider.accounts = [wallet];
    provider.emit("accountsChanged", [wallet]);
  });
  await screen.findByTitle(wallet);
  expect(
    screen.queryByRole("link", { name: "View order other-wallet on Ethereum" }),
  ).not.toBeInTheDocument();
  expect(
    await screen.findByRole("link", {
      name: "View order after-return on Ethereum",
    }),
  ).toBeInTheDocument();

  fireEvent.click(await screen.findByTitle(wallet));
  fireEvent.click(await screen.findByRole("button", { name: /Disconnect/ }));
  await screen.findByText("Connect a wallet to view your stop-loss orders.");
  expect(
    screen.queryByRole("link", { name: /^View order/ }),
  ).not.toBeInTheDocument();
});

test("ignores late responses from the previous account", async () => {
  const second = "0x2222222222222222222222222222222222222222";
  const pending: (() => void)[] = [];
  let started!: () => void;
  const oldRequestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  global.fetch = jest.fn(async (_url, init) => {
    const { query, variables } = JSON.parse(init?.body as string);
    const ownership = query.includes("ownerMappings");
    if (!ownership && variables.wallet === wallet) {
      await new Promise<void>((resolve) => {
        pending.push(resolve);
        started();
      });
    }
    return {
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          [ownership ? "ownerMappings" : "conditionalOrderGenerators"]: {
            items:
              !ownership && variables.chain === 1
                ? [
                    {
                      ...parent,
                      owner: variables.wallet,
                      resolvedOwner: variables.wallet,
                      eventId:
                        variables.wallet === wallet
                          ? "late-old-account"
                          : "current-account",
                    },
                  ]
                : [],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    } as Response;
  });
  const provider = new BrowserWallet();
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await oldRequestStarted;

  await act(async () => {
    provider.accounts = [second];
    provider.emit("accountsChanged", [second]);
  });
  await screen.findByRole("link", {
    name: "View order current-account on Ethereum",
  });
  await act(async () => {
    pending.forEach((resolve) => resolve());
  });

  expect(
    screen.getByRole("link", {
      name: "View order current-account on Ethereum",
    }),
  ).toHaveAttribute("href", `/1/${second}/current-account`);
  expect(
    screen.queryByRole("link", {
      name: "View order late-old-account on Ethereum",
    }),
  ).not.toBeInTheDocument();
});

test("keeps a mismatched detail link without fetching the other account's orders", async () => {
  const expected = "0x2222222222222222222222222222222222222222";
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: expected, chainId: 1, orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByTitle(wallet);

  expect(
    screen.getByText(`Connect ${expected} to view this order.`),
  ).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: /Cancel/ }),
  ).not.toBeInTheDocument();
});

test("shows owned order details, prices and partial execution without cancellation", async () => {
  serveOrders([
    {
      ...parent,
      discreteOrders: {
        items: [
          {
            orderUid: `0x${"cd".repeat(56)}`,
            status: "open",
            validTo: 4102444800,
            executedSellAmount: "400000000000000000",
            executedBuyAmount: "840000000",
            executedFee: "0",
          },
        ],
      },
    },
  ]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: wallet, chainId: 1, orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("heading", { name: "Order details" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("definition", { name: "Sell amount" }),
  ).toHaveTextContent("1 WETH");
  expect(
    screen.getByRole("definition", { name: "Minimum buy amount" }),
  ).toHaveTextContent("2000 USDC");
  expect(
    screen.getByRole("definition", { name: "Trigger price" }),
  ).toHaveTextContent("2100 USDC per WETH");
  expect(
    screen.getByRole("definition", { name: "Limit price" }),
  ).toHaveTextContent("2000 USDC per WETH");
  expect(
    screen.getByRole("definition", { name: "Execution price" }),
  ).toHaveTextContent("2100 USDC per WETH");
  expect(
    screen.getByRole("definition", { name: "Executed sell amount" }),
  ).toHaveTextContent("0.4 WETH");
  expect(
    screen.getByRole("definition", { name: "Executed buy amount" }),
  ).toHaveTextContent("840 USDC");
  expect(
    screen.getByRole("definition", { name: "Receiver" }),
  ).toHaveTextContent(wallet);
  expect(
    screen.getByRole("definition", { name: "Valid until" }),
  ).toHaveTextContent("2100-01-01 00:00:00 UTC");
  expect(
    screen.getByRole("definition", { name: "Maximum oracle age" }),
  ).toHaveTextContent("3600 seconds");
  expect(
    screen.getByRole("definition", { name: "Sell token oracle" }),
  ).toHaveTextContent(parent.decodedParams.sellTokenPriceOracle);
  expect(
    screen.getByRole("definition", { name: "Buy token oracle" }),
  ).toHaveTextContent(parent.decodedParams.buyTokenPriceOracle);
  expect(screen.getByRole("link", { name: "View CoW order" })).toHaveAttribute(
    "href",
    expect.stringContaining("/orders/0xcd"),
  );
  expect(
    screen.queryByRole("button", { name: /Cancel/ }),
  ).not.toBeInTheDocument();
});

test("links the creation transaction to the order's chain explorer", async () => {
  const hash = `0x${"ef".repeat(32)}`;
  serveOrders([
    { ...parent, chainId: 42161, transaction: { ...parent.transaction, hash } },
  ]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{
          safeAddress: wallet,
          chainId: "42161",
          orderId: "stop-loss-1",
        }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("link", { name: "View creation transaction" }),
  ).toHaveAttribute("href", `https://arbiscan.io/tx/${hash}`);
});

test("shows the reported fee in base units without assuming its token", async () => {
  serveOrders([
    {
      ...parent,
      discreteOrders: {
        items: [
          {
            orderUid: `0x${"cd".repeat(56)}`,
            status: "fulfilled",
            validTo: 4102444800,
            executedSellAmount: "1000000000000000000",
            executedBuyAmount: "2100000000",
            executedFee: "10000000000000000",
          },
        ],
      },
    },
  ]);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: wallet, chainId: 1, orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(
    await screen.findByRole("definition", { name: "Executed fee" }),
  ).toHaveTextContent("10000000000000000 base units (fee token not supplied)");
});

test("refreshes a missing order when it becomes available in the index", async () => {
  const orders: ApiParent[] = [];
  serveOrders(orders);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: wallet, chainId: "1", orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByText(
    "Order not found for the connected account on Ethereum.",
  );

  orders.push(parent);
  fireEvent.click(screen.getByRole("button", { name: "Refresh orders" }));

  expect(
    await screen.findByRole("heading", { name: "Order details" }),
  ).toBeInTheDocument();
});

test("rejects an unsupported detail chain before fetching any orders", async () => {
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: wallet, chainId: "137", orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();
  await screen.findByTitle(wallet);

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Unsupported chain: 137.",
  );
  expect(global.fetch).not.toHaveBeenCalled();
});

test("keeps detail API failure separate from not found and retries the requested chain", async () => {
  const unavailable = new Set([1, 100]);
  serveOrders([parent], unavailable);
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: new BrowserWallet(),
  });
  render(
    <RootLayout>
      <OrderPage
        params={{ safeAddress: wallet, chainId: "1", orderId: "stop-loss-1" }}
      />
    </RootLayout>,
  );
  await connectBrowserWallet();

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Ethereum order data is unavailable.",
  );
  expect(screen.queryByText(/Order not found/)).not.toBeInTheDocument();
  unavailable.delete(1);
  fireEvent.click(screen.getByRole("button", { name: "Retry Ethereum" }));

  expect(
    await screen.findByRole("heading", { name: "Order details" }),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByRole("definition", { name: "CoW order" }),
  ).toHaveTextContent("Not triggered");
  expect(
    screen.getByRole("definition", { name: "Executed sell amount" }),
  ).toHaveTextContent("Not available");
});

test("keeps browser connection available when WalletConnect is not configured", async () => {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  try {
    config = createWagmiConfig();
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: new BrowserWallet(),
    });
    render(
      <RootLayout>
        <HomePage />
      </RootLayout>,
    );

    expect(
      await screen.findByRole("button", { name: "Connect wallet" }),
    ).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Browser wallet" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Connect wallet" }));
    const browserWallet = await screen.findByRole("button", {
      name: "Browser wallet",
    });
    expect(
      screen.queryByRole("button", { name: "WalletConnect" }),
    ).not.toBeInTheDocument();
    fireEvent.click(browserWallet);
    expect(await screen.findByTitle(wallet)).toBeInTheDocument();
  } finally {
    if (projectId !== undefined)
      process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = projectId;
  }
});

test("uses the Safe account returned by WalletConnect instead of a browser signer", async () => {
  const safe = "0x3333333333333333333333333333333333333333";
  class SafeWallet extends EventEmitter {
    events = this;
    accounts: string[] = [];
    chainId = 100;
    async connect() {}
    async enable() {
      this.accounts = [safe];
      return this.accounts;
    }
    async disconnect() {
      this.accounts = [];
    }
    async request({ method }: { method: string }) {
      throw new Error(`Unexpected wallet request: ${method}`);
    }
  }
  jest
    .spyOn(EthereumProvider, "init")
    .mockResolvedValue(
      new SafeWallet() as unknown as Awaited<
        ReturnType<typeof EthereumProvider.init>
      >,
    );
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = "test-project-id";
  try {
    config = createWagmiConfig();
    serveOrders([
      parent,
      { ...parent, eventId: "safe-order", owner: safe, resolvedOwner: safe },
    ]);
    Object.defineProperty(window, "ethereum", {
      configurable: true,
      value: new BrowserWallet(),
    });
    render(
      <RootLayout>
        <HomePage />
      </RootLayout>,
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Connect wallet" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "WalletConnect" }),
    );

    expect(
      await screen.findByRole("link", {
        name: "View order safe-order on Ethereum",
      }),
    ).toHaveAttribute("href", `/1/${safe}/safe-order`);
    expect(
      screen.queryByRole("link", {
        name: "View order stop-loss-1 on Ethereum",
      }),
    ).not.toBeInTheDocument();
    expect(screen.getByTitle(safe)).toBeInTheDocument();
    fireEvent.click(screen.getByTitle(safe));
    fireEvent.click(await screen.findByRole("button", { name: /Disconnect/ }));
    await screen.findByText("Connect a wallet to view your stop-loss orders.");
  } finally {
    if (projectId === undefined)
      delete process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
    else process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID = projectId;
  }
});

test("connects and disconnects a browser wallet without a chain switch", async () => {
  const provider = new BrowserWallet();
  Object.defineProperty(window, "ethereum", {
    configurable: true,
    value: provider,
  });
  render(
    <RootLayout>
      <HomePage />
    </RootLayout>,
  );

  fireEvent.click(
    await screen.findByRole("button", { name: "Connect wallet" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "Browser wallet" }),
  );
  const account = await screen.findByTitle(wallet);
  fireEvent.click(account);
  fireEvent.click(await screen.findByRole("button", { name: /Disconnect/ }));

  expect(
    await screen.findByRole("button", { name: "Connect wallet" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Browser wallet" }),
  ).not.toBeInTheDocument();
});
