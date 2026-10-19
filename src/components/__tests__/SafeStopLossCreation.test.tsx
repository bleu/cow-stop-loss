/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import { hashDomain } from "viem";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import {
  EXTENSIBLE_FALLBACK_ADDRESS,
  GPV2_VAULT_RELAYER_ADDRESS,
  SETTLEMENT_CONTRACT_ADDRESS,
} from "#/lib/contracts";
import { publicClientsFromIds } from "#/lib/publicClients";
import { createWagmiConfig } from "#/utils/wagmi";

import { SafeStopLossCreation } from "../SafeStopLossCreation";

const account = "0x1111111111111111111111111111111111111111";
let connectedAccount = account;
let proposalExecuted = false;
const rpcRequest = jest.fn();
const originalFetch = global.fetch;

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: connectedAccount,
    chainId: 11155111,
    isConnected: true,
    connector: {
      id: "walletConnect",
      getProvider: async () => ({ request: rpcRequest }),
    },
  }),
}));

beforeEach(() => {
  connectedAccount = account;
  proposalExecuted = false;
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (_name: string, action: () => unknown) => action(),
    },
  });
  rpcRequest.mockReset();
  rpcRequest.mockImplementation(async ({ method }) => {
    if (method === "wallet_getCapabilities")
      return { "0xaa36a7": { atomic: { status: "supported" } } };
    if (method === "eth_chainId") return "0xaa36a7";
    if (method === "eth_accounts") return [connectedAccount];
    throw new Error(`Unexpected wallet call: ${method}`);
  });
  useAdvancedSettingsStore
    .getState()
    .setAdvancedSettings(defaultAdvancedSettings);
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
  global.fetch = jest.fn(async (input, init) => {
    const url = String(input);
    if (url.includes("/api/safe/")) {
      const query = new URL(url, "http://localhost").searchParams;
      return {
        ok: true,
        status: 200,
        json: async () =>
          query.get("action") === "replacements"
            ? { results: [] }
            : {
                safe: account,
                safeTxHash: query.get("hash"),
                nonce: "1",
                isExecuted: proposalExecuted,
                isSuccessful: proposalExecuted ? true : null,
                transactionHash: proposalExecuted
                  ? `0x${"cd".repeat(32)}`
                  : null,
              },
      } as Response;
    }
    if (url.includes("/app_data/"))
      return {
        ok: true,
        status: 200,
        json: async () => url.split("/").pop(),
      } as Response;
    if (url.includes("programmatic-orders")) {
      const { query } = JSON.parse(String(init?.body));
      const field = query.includes("ownerMappings")
        ? "ownerMappings"
        : "conditionalOrderGenerators";
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: {
            [field]: {
              items: [],
              pageInfo: { hasNextPage: false, endCursor: null },
            },
          },
        }),
      } as Response;
    }
    return {
      ok: true,
      json: async () => ({
        price: url.toLowerCase().includes("fff997") ? 2000 : 1,
      }),
    } as Response;
  });
  const client = publicClientsFromIds[11155111];
  const now = BigInt(Math.floor(Date.now() / 1000));
  jest.spyOn(client, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest.spyOn(client, "getBlock").mockResolvedValue({ timestamp: now } as never);
  jest.spyOn(client, "getBytecode").mockResolvedValue("0x01");
  jest
    .spyOn(client, "getStorageAt")
    .mockResolvedValue(`0x${"00".repeat(12)}${"22".repeat(20)}`);
  jest
    .spyOn(client, "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "domainSeparator")
        return hashDomain({
          domain: {
            name: "Gnosis Protocol",
            version: "v2",
            chainId: 11155111,
            verifyingContract: SETTLEMENT_CONTRACT_ADDRESS,
          },
          types: {
            EIP712Domain: [
              { name: "name", type: "string" },
              { name: "version", type: "string" },
              { name: "chainId", type: "uint256" },
              { name: "verifyingContract", type: "address" },
            ],
          },
        });
      if (functionName === "vaultRelayer") return GPV2_VAULT_RELAYER_ADDRESS;
      if (functionName === "balanceOf") return BigInt("5000000000000000000");
      if (functionName === "allowance") return BigInt(0);
      if (functionName === "singleOrders") return false;
      if (functionName === "decimals") return 8;
      if (functionName === "latestRoundData")
        return [
          BigInt(1),
          address?.toLowerCase() ===
          "0x57cb700070cb1b0475e2d668fa8e89cf0dda9509"
            ? BigInt(200000000000)
            : BigInt(100000000),
          now,
          now,
          BigInt(1),
        ];
      throw new Error(`Unexpected RPC read: ${functionName}`);
    });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function showCreation() {
  const config = createWagmiConfig();
  const queryClient = new QueryClient();
  const content = () => (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <SWRConfig
          value={{ provider: () => new Map(), revalidateOnFocus: false }}
        >
          <SafeStopLossCreation />
        </SWRConfig>
      </QueryClientProvider>
    </WagmiProvider>
  );
  const view = render(content());
  return { ...view, refreshWallet: () => view.rerender(content()) };
}

async function reviewOrder(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.click(
    await screen.findByRole("button", { name: "Review Stop Loss order" }),
  );
  return screen.findByRole("region", { name: "Review Safe stop-loss order" });
}

it("does not open the Safe wallet after leaving the page during capability checks", async () => {
  const user = userEvent.setup();
  const view = showCreation();
  await reviewOrder(user);
  let release!: (value: unknown) => void;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_getCapabilities") return waiting;
    if (args.method === "wallet_sendCalls")
      return { id: `0x${"ab".repeat(32)}` };
    return request(args);
  });
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await waitFor(() =>
    expect(
      rpcRequest.mock.calls.filter(
        ([request]) => request.method === "wallet_getCapabilities",
      ),
    ).toHaveLength(2),
  );
  view.unmount();
  await act(async () => {
    release({ "0xaa36a7": { atomic: { status: "supported" } } });
  });
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(0);
});

it("requires review when atomic batching becomes unavailable before submission", async () => {
  const user = userEvent.setup();
  const view = showCreation();
  await reviewOrder(user);
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_getCapabilities") return {};
    if (args.method === "eth_sendTransaction") return `0x${"ab".repeat(32)}`;
    return request(args);
  });
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Safe submission mode changed. Review the order again.",
  );
  expect(
    screen.getByRole("region", { name: "Review Safe stop-loss order" }),
  ).toHaveTextContent("Sequential transactions");
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "eth_sendTransaction",
    ),
  ).toHaveLength(0);
  view.unmount();
});

it("requires review of approval and reset calls added after allowance falls", async () => {
  const user = userEvent.setup();
  let allowance = BigInt("5000000000000000000");
  const read = jest
    .mocked(publicClientsFromIds[11155111].readContract)
    .getMockImplementation()!;
  jest
    .mocked(publicClientsFromIds[11155111].readContract)
    .mockImplementation(async (args) =>
      args.functionName === "allowance" ? allowance : read(args),
    );
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) =>
    args.method === "wallet_sendCalls"
      ? { id: `0x${"ab".repeat(32)}` }
      : request(args),
  );
  showCreation();
  const review = await reviewOrder(user);
  expect(review).toHaveTextContent("Already approved");
  allowance = BigInt("500000000000000000");
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Safe setup or funding changed. Review the order again.",
  );
  expect(
    within(review).getByText("Token approval").parentElement,
  ).toHaveTextContent("1 WETH");
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(0);
});

it("releases the form when a saved pending proposal expires while the page is open", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) =>
    args.method === "wallet_sendCalls"
      ? { id: `0x${"ab".repeat(32)}` }
      : request(args),
  );
  const view = showCreation();
  const review = await reviewOrder(user);
  const expires = new Date(
    within(review).getByText("Expires").nextElementSibling!.textContent!,
  ).getTime();
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await screen.findByText("Awaiting signatures");
  view.unmount();
  jest.useFakeTimers({ now: expires - 500 });
  try {
    showCreation();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("Awaiting signatures")).toBeInTheDocument();
    await act(async () => {
      await jest.advanceTimersByTimeAsync(1000);
    });
    expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

it("keeps a lost later response paused with an error after reload", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  let sends = 0;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_getCapabilities") return {};
    if (args.method === "eth_sendTransaction") {
      sends += 1;
      if (sends > 1) throw new Error("Wallet response lost");
      return `0x${"ab".repeat(32)}`;
    }
    return request(args);
  });
  const first = showCreation();
  await reviewOrder(user);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await screen.findByText("Awaiting signatures");
  first.unmount();
  proposalExecuted = true;
  const second = showCreation();
  await user.click(
    await screen.findByRole("button", { name: "Continue placement" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit Safe order" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Wallet response lost",
  );
  second.unmount();
  showCreation();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Wallet response lost",
  );
  expect(
    screen.queryByRole("button", { name: "Continue placement" }),
  ).not.toBeInTheDocument();
  expect(sends).toBe(2);
});

it("requires another review when the Safe fallback handler changes before submission", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) =>
    args.method === "wallet_sendCalls"
      ? { id: `0x${"ab".repeat(32)}` }
      : request(args),
  );
  showCreation();
  await reviewOrder(user);
  jest
    .mocked(publicClientsFromIds[11155111].getStorageAt)
    .mockResolvedValue(`0x${"00".repeat(12)}${"33".repeat(20)}`);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Safe setup or funding changed. Review the order again.",
  );
  expect(
    screen.getByRole("region", { name: "Review Safe stop-loss order" }),
  ).toHaveTextContent("0x3333333333333333333333333333333333333333");
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  expect(await screen.findByText("Awaiting signatures")).toBeInTheDocument();
});

it("keeps an expired proposal saved without blocking the regular order form", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) =>
    args.method === "wallet_sendCalls"
      ? { id: `0x${"ab".repeat(32)}` }
      : request(args),
  );
  const view = showCreation();
  await reviewOrder(user);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await screen.findByText("Awaiting signatures");
  view.unmount();
  const now = Date.now();
  const clock = jest
    .spyOn(Date, "now")
    .mockReturnValue(now + 365 * 24 * 3600 * 1000);
  const expired = showCreation();
  expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "2000",
  );
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  expect(
    screen.getByRole("button", { name: "Review Stop Loss order" }),
  ).toBeEnabled();
  expired.unmount();
  clock.mockRestore();
  showCreation();
  expect(await screen.findByText("Awaiting signatures")).toBeInTheDocument();
});

it("resumes sequential setup with fixed expiry and waits for an explicit next submission", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_getCapabilities") return {};
    if (args.method === "eth_sendTransaction") return `0x${"ab".repeat(32)}`;
    return request(args);
  });
  const view = showCreation();
  const review = await reviewOrder(user);
  const expiry = within(review).getByText("Expires").parentElement!.textContent;
  expect(review).toHaveTextContent("Sequential transactions");
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await screen.findByText("Awaiting signatures");
  view.unmount();
  proposalExecuted = true;
  jest
    .mocked(publicClientsFromIds[11155111].getStorageAt)
    .mockResolvedValue(
      `0x${"00".repeat(12)}${EXTENSIBLE_FALLBACK_ADDRESS.slice(2)}`,
    );
  const read = jest
    .mocked(publicClientsFromIds[11155111].readContract)
    .getMockImplementation()!;
  jest
    .mocked(publicClientsFromIds[11155111].readContract)
    .mockImplementation(async (args) =>
      args.functionName === "domainVerifiers"
        ? "0x0000000000000000000000000000000000000000"
        : read(args),
    );
  showCreation();
  await user.click(
    await screen.findByRole("button", { name: "Continue placement" }),
  );
  const resumed = await screen.findByRole("region", {
    name: "Review Safe stop-loss order",
  });
  expect(within(resumed).getByText("Expires").parentElement).toHaveTextContent(
    expiry!,
  );
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "eth_sendTransaction",
    ),
  ).toHaveLength(1);
  expect(
    within(resumed).getByRole("button", { name: "Submit Safe order" }),
  ).toBeEnabled();
  await user.click(
    within(resumed).getByRole("button", { name: "Submit Safe order" }),
  );
  await waitFor(() =>
    expect(
      rpcRequest.mock.calls.filter(
        ([request]) => request.method === "eth_sendTransaction",
      ),
    ).toHaveLength(2),
  );
});

it("does not open the old Safe wallet after the account changes during capability checks", async () => {
  const user = userEvent.setup();
  const view = showCreation();
  await reviewOrder(user);
  let release!: (value: unknown) => void;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_getCapabilities") return waiting;
    if (args.method === "eth_accounts") return [account];
    if (args.method === "wallet_sendCalls")
      return { id: `0x${"ab".repeat(32)}` };
    return request(args);
  });
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await waitFor(() =>
    expect(
      rpcRequest.mock.calls.filter(
        ([request]) => request.method === "wallet_getCapabilities",
      ),
    ).toHaveLength(2),
  );
  connectedAccount = "0x3333333333333333333333333333333333333333";
  view.refreshWallet();
  await act(async () => {
    release({ "0xaa36a7": { atomic: { status: "supported" } } });
  });
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(0);
  expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
});

it("shows a lost first response as an error without a pending order or automatic retry", async () => {
  const user = userEvent.setup();
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) => {
    if (args.method === "wallet_sendCalls")
      throw new Error("Wallet response lost");
    return request(args);
  });
  const view = showCreation();
  await reviewOrder(user);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No automatic retry was made",
  );
  expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
  view.unmount();
  showCreation();
  expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(1);
});

it("shows awaiting signatures only after the Safe returns an accepted proposal", async () => {
  const user = userEvent.setup();
  let accept!: (value: unknown) => void;
  const response = new Promise((resolve) => {
    accept = resolve;
  });
  const request = rpcRequest.getMockImplementation()!;
  rpcRequest.mockImplementation(async (args) =>
    args.method === "wallet_sendCalls" ? response : request(args),
  );
  showCreation();
  await reviewOrder(user);
  await user.click(screen.getByRole("button", { name: "Submit Safe order" }));
  await waitFor(() =>
    expect(
      rpcRequest.mock.calls.some(
        ([request]) => request.method === "wallet_sendCalls",
      ),
    ).toBe(true),
  );
  expect(screen.queryByText("Awaiting signatures")).not.toBeInTheDocument();
  await act(async () => {
    accept({ id: `0x${"ab".repeat(32)}` });
  });
  expect(await screen.findByText("Awaiting signatures")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /Abandon|Remove|New draft/i }),
  ).not.toBeInTheDocument();
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(1);
});

it("reviews Safe ownership, fallback replacement and one atomic batch without sending", async () => {
  const user = userEvent.setup();
  showCreation();
  const review = await reviewOrder(user);
  expect(
    within(review).getByText("Safe execution account").parentElement,
  ).toHaveTextContent(account);
  expect(review).toHaveTextContent("Replace the current Safe fallback handler");
  expect(review).toHaveTextContent("One atomic batch");
  expect(
    within(review).getByText("Token approval").parentElement,
  ).toHaveTextContent("1 WETH");
  expect(review).toHaveTextContent("Sepolia (testnet)");
  expect(
    within(review).getByRole("button", { name: "Submit Safe order" }),
  ).toBeEnabled();
  expect(
    rpcRequest.mock.calls.some(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toBe(false);
});
