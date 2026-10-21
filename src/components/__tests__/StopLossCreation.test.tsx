/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

// Opt in to simulated TEST approvals; production policy remains unchanged.
jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      TEST_SUPPORTED_TOKENS[chainId] ?? actual.getSupportedTokens(chainId),
  };
});

import { toast } from "@bleu/ui";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import {
  decodeFunctionData,
  parseAbi,
  type ReadContractParameters,
  zeroAddress,
} from "viem";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import {
  getStopLossPlacement,
  resumeStopLossPlacement,
} from "#/hooks/useStopLossPlacement";
import { STOP_LOSS_ADDRESS } from "#/lib/contracts";
import type { PreparedPlacement } from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
import { createStopLossPlacement } from "#/lib/stopLossPlacement";
import { createWagmiConfig } from "#/utils/wagmi";

import { StopLossCreation } from "../StopLossCreation";

const account = "0x1111111111111111111111111111111111111111";
let requestLock: (action: () => unknown) => Promise<unknown>;
let connectedAccount: `0x${string}` = account;
let chainTime: bigint;
const originalFetch = global.fetch;
const sendTransactionAsync = jest.fn();
jest.mock("@bleu/ui", () => ({
  ...jest.requireActual("@bleu/ui"),
  toast: jest.fn(),
}));
jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: connectedAccount,
    chainId: 1,
    isConnected: true,
  }),
  useSendTransaction: () => ({ sendTransactionAsync }),
}));

beforeEach(() => {
  requestLock = async (action) => action();
  connectedAccount = account;
  chainTime = BigInt(Math.floor(Date.now() / 1000));
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_name: string, action: () => unknown) => requestLock(action),
    },
  });
  sendTransactionAsync.mockReset();
  jest.mocked(toast).mockClear();
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
        price: url.toLowerCase().includes("c02aaa") ? 2000 : 1e12,
      }),
    } as Response;
  });
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(100));
  jest
    .spyOn(publicClientsFromIds[1], "getBlock")
    .mockResolvedValue({ timestamp: chainTime } as never);
  jest.spyOn(publicClientsFromIds[1], "getBytecode").mockResolvedValue("0x01");
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "balanceOf") return BigInt("5000000000000000000");
      if (functionName === "allowance") return BigInt(0);
      if (functionName === "singleOrders") return false;
      if (
        functionName === "COW_SHED_FACTORY" ||
        functionName === "trustedExecutor"
      )
        return "0x3333333333333333333333333333333333333333";
      if (functionName === "proxyOf")
        return "0x4444444444444444444444444444444444444444";
      if (functionName === "COMPOSABLE_COW")
        return "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74";
      if (functionName === "domainSeparator") return `0x${"ef".repeat(32)}`;
      if (functionName === "decimals") return 8;
      if (functionName === "latestRoundData") {
        const now = chainTime;
        return [
          BigInt(1),
          address?.toLowerCase().includes("5f4ec3")
            ? BigInt(200000000000)
            : BigInt(100000000),
          now,
          now,
          BigInt(1),
        ];
      }
      throw new Error(`Unexpected RPC read: ${functionName}`);
    });
  jest
    .spyOn(publicClientsFromIds[1], "multicall")
    .mockImplementation(async ({ contracts }) =>
      Promise.all(
        contracts.map(async (contract) => {
          try {
            return {
              status: "success" as const,
              result: await publicClientsFromIds[1].readContract(
                contract as ReadContractParameters,
              ),
            };
          } catch (error) {
            return { status: "failure" as const, error };
          }
        }),
      ),
    );
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
          <StopLossCreation />
        </SWRConfig>
      </QueryClientProvider>
    </WagmiProvider>
  );
  const view = render(content());
  return { ...view, refreshWallet: () => view.rerender(content()) };
}

it("does not fill the trigger price when a sell token is selected", async () => {
  const user = userEvent.setup();
  showCreation();

  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /WETH/ }));
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });

  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "",
  );
});

it.each([true, false])(
  "opens the first review render with approval required: %s",
  async (approvalRequired) => {
    const user = userEvent.setup();
    if (!approvalRequired) {
      const rpc = jest.mocked(publicClientsFromIds[1].readContract);
      const read = rpc.getMockImplementation()!;
      rpc.mockImplementation(async (args) =>
        args.functionName === "allowance"
          ? BigInt("5000000000000000000")
          : read(args),
      );
    }
    let releaseUpload!: () => void;
    let uploadStarted = false;
    const upload = new Promise<void>((resolve) => {
      releaseUpload = resolve;
    });
    const fetch = global.fetch;
    global.fetch = jest.fn(async (input, init) => {
      if (String(input).includes("/app_data/")) {
        uploadStarted = true;
        await upload;
      }
      return fetch(input, init);
    });
    showCreation();
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
    try {
      await waitFor(() => expect(uploadStarted).toBe(true));
      expect(
        screen.queryByRole("region", { name: "Review stop-loss order" }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Validating/ })).toBeDisabled();
    } finally {
      await act(async () => {
        releaseUpload();
      });
    }
    const review = await screen.findByRole("region", {
      name: "Review stop-loss order",
    });
    expect(
      within(review).getByRole("button", {
        name: approvalRequired ? "Approve WETH" : "Place order",
      }),
    ).toBeEnabled();
    expect(
      Boolean(within(review).queryByRole("radio", { name: "Limited" })),
    ).toBe(approvalRequired);
    expect(sendTransactionAsync).not.toHaveBeenCalled();
  },
);

it("confirms approval before enabling Place and does not send setup automatically", async () => {
  const user = userEvent.setup();
  let allowance = BigInt(0);
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) =>
    args.functionName === "allowance" ? allowance : read(args),
  );
  sendTransactionAsync.mockImplementation(async () => {
    allowance = BigInt("1000000000000000000");
    return `0x${"ab".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"ab".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showCreation();
  await reviewOneOrder(user);
  await user.click(await screen.findByRole("button", { name: "Approve WETH" }));

  await waitFor(() => {
    const alert = screen.queryByRole("alert");
    if (alert) throw new Error(alert.textContent ?? "Approval failed");
    expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
  });
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
  );
  expect(
    screen.queryByRole("button", { name: "Approve WETH" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledWith(
    expect.objectContaining({
      account,
      chainId: 1,
      to: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
    }),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("places only on request, closes after on-chain checks, and keeps the form values", async () => {
  const user = userEvent.setup();
  let walletAllowance = BigInt(0);
  let schedule: unknown;
  const factory = "0x3333333333333333333333333333333333333333";
  const owner = "0x4444444444444444444444444444444444444444";
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) => {
    if (args.functionName === "allowance")
      return Array.isArray(args.args) && args.args[0] === owner
        ? schedule
          ? BigInt(
              "115792089237316195423570985008687907853269984665640564039457584007913129639935",
            )
          : BigInt(0)
        : walletAllowance;
    if (args.functionName === "singleOrders") return !!schedule;
    if (args.functionName === "schedules")
      return (
        schedule ?? [
          zeroAddress,
          BigInt(0),
          zeroAddress,
          zeroAddress,
          `0x${"00".repeat(32)}`,
          "0x",
        ]
      );
    return read(args);
  });
  sendTransactionAsync.mockImplementation(async ({ to, data }) => {
    if (to === factory) {
      const setup = decodeFunctionData({
        abi: parseAbi([
          "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
        ]),
        data,
      });
      const registration = decodeFunctionData({
        abi: parseAbi([
          "function registerFromShed((address handler,uint96 authEpoch,address funder,address owner,bytes32 salt,bytes staticInput) schedule) returns (bytes32 id)",
        ]),
        data: setup.args![0].at(-1)!.callData,
      }).args![0];
      schedule = [
        registration.handler,
        registration.authEpoch,
        registration.funder,
        registration.owner,
        registration.salt,
        registration.staticInput,
      ];
    } else {
      walletAllowance = BigInt("1000000000000000000");
    }
    return `0x${"ab".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(
      async ({ hash }) =>
        ({
          status: "success",
          transactionHash: hash,
          blockNumber: BigInt(101),
        }) as never,
    );
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole("button", { name: "Place order" }));

  await waitFor(() => expect(sendTransactionAsync).toHaveBeenCalledTimes(2));
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "Review stop-loss order" }),
    ).not.toBeInTheDocument(),
  );
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("1");
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
});

it("includes orders confirmed during preparation in the next review funding total", async () => {
  const user = userEvent.setup();
  let firstOrder!: PreparedPlacement;
  let created = false;
  let confirmDuringPreparation = false;
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) => {
    if (args.functionName === "allowance") return BigInt("1500000000000000000");
    if (args.functionName === "singleOrders") return created;
    if (args.functionName === "funded") return false;
    if (args.functionName === "schedules")
      return created
        ? [
            STOP_LOSS_ADDRESS,
            BigInt(0),
            account,
            firstOrder.owner,
            firstOrder.draft.salt,
            firstOrder.staticInput,
          ]
        : [
            zeroAddress,
            BigInt(0),
            zeroAddress,
            zeroAddress,
            `0x${"00".repeat(32)}`,
            "0x",
          ];
    return read(args);
  });
  sendTransactionAsync.mockImplementation(async () => {
    firstOrder = getStopLossPlacement().getRecords({ account, chainId: 1 })[0]
      .prepared;
    throw Object.assign(new Error("User rejected the request"), { code: 4001 });
  });
  const fetch = global.fetch;
  global.fetch = jest.fn(async (input, init) => {
    if (String(input).includes("/app_data/") && confirmDuringPreparation) {
      confirmDuringPreparation = false;
      created = true;
      const otherTab = createStopLossPlacement({
        storage: localStorage,
        locks: navigator.locks,
      });
      await otherTab.submit(firstOrder, "setup", {
        send: async () => ({ id: "other-tab-creation" }),
      });
      await otherTab.resume(firstOrder, { checkState: async () => true });
    }
    return fetch(input, init);
  });
  showCreation();
  await reviewOneOrder(user, false);
  await user.click(screen.getByRole("button", { name: "Place order" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Request cancelled in your wallet." }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  confirmDuringPreparation = true;
  await user.click(
    screen.getByRole("button", { name: "Review Stop Loss order" }),
  );
  const dialog = await screen.findByRole("region", {
    name: "Review stop-loss order",
  });
  await waitFor(() =>
    expect(
      within(dialog).getByRole("radio", { name: "Limited" }).closest("label"),
    ).toHaveTextContent("2 WETH"),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("reopens saved pending approval after reload without another wallet request", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue("opaque-wallet-reference");
  const view = showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() => expect(sendTransactionAsync).toHaveBeenCalledTimes(1));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Edit order" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  view.unmount();
  showCreation();

  await user.click(
    await screen.findByRole("button", { name: "Continue placement" }),
  );
  expect(
    within(
      await screen.findByRole("group", { name: "Order amounts" }),
    ).getByRole("button", { name: "Show exact amount: 1 WETH" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("blocks a new review while an unfinished placement is saved", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue("unknown-approval");
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Edit order" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  const amount = screen.getByRole("textbox", { name: "Sell amount" });
  await user.clear(amount);
  await user.type(amount, "2");
  expect(
    screen.getByRole("button", { name: "Review Stop Loss order" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Continue placement" }));
  expect(
    within(
      await screen.findByRole("group", { name: "Order amounts" }),
    ).getByRole("button", { name: "Show exact amount: 1 WETH" }),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("abandons an expired approval-only placement and permits a fresh review", async () => {
  const user = userEvent.setup();
  let allowance = BigInt(0);
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) => {
    if (args.functionName === "allowance") return allowance;
    if (args.functionName === "singleOrders") return false;
    return read(args);
  });
  sendTransactionAsync.mockImplementation(async () => {
    allowance = BigInt("1000000000000000000");
    return `0x${"ab".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"ab".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  chainTime += BigInt(10 * 365 * 24 * 3600);
  jest
    .mocked(publicClientsFromIds[1].getBlock)
    .mockImplementation(async () => ({ timestamp: chainTime }) as never);
  await user.click(screen.getByRole("button", { name: "Continue placement" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not check the transaction. Please try again.",
      }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Abandon placement" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("region", { name: "Review stop-loss order" }),
    ).not.toBeInTheDocument(),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Continue placement" }),
    ).not.toBeInTheDocument(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
  expect(allowance).toBe(BigInt("1000000000000000000"));
  chainTime = BigInt(Math.floor(Date.now() / 1000));
  const amount = screen.getByRole("textbox", { name: "Sell amount" });
  await user.clear(amount);
  await user.type(amount, "2");
  await user.click(
    screen.getByRole("button", { name: "Review Stop Loss order" }),
  );
  expect(
    within(
      await screen.findByRole("group", { name: "Order amounts" }),
    ).getByRole("button", { name: "Show exact amount: 2 WETH" }),
  ).toBeInTheDocument();
});

it("keeps unknown approval pending without changing the card or sending again", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue("opaque-wallet-reference");
  showCreation();
  await reviewOneOrder(user);
  const review = screen.getByRole("region", { name: "Review stop-loss order" });
  const elements = review.querySelectorAll("*").length;
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Approving…" })).toBeDisabled(),
  );
  await act(async () => {
    await resumeStopLossPlacement(account, 1);
  });
  expect(review.querySelectorAll("*")).toHaveLength(elements);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Retry" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Abandon placement" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("shows a reverted approval, keeps the failure after closing, and permits an explicit retry", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue(`0x${"ab".repeat(32)}`);
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "reverted",
      transactionHash: `0x${"ab".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not approve the token. Please try again.",
      }),
    ),
  );
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(2);
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(2);
});

it("shows a reverted setup as an error and does not show confirmation", async () => {
  const user = userEvent.setup();
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) => {
    if (args.functionName === "allowance") return BigInt("1000000000000000000");
    if (args.functionName === "schedules")
      return [
        zeroAddress,
        BigInt(0),
        zeroAddress,
        zeroAddress,
        `0x${"00".repeat(32)}`,
        "0x",
      ];
    return read(args);
  });
  sendTransactionAsync.mockResolvedValue(`0x${"ab".repeat(32)}`);
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "reverted",
      transactionHash: `0x${"ab".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showCreation();
  await reviewOneOrder(user, false);
  await user.click(screen.getByRole("button", { name: "Place order" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not place the order. Please try again.",
      }),
    ),
  );
  expect(
    screen.getByRole("region", { name: "Review stop-loss order" }),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("checks an uncertain approval again without sending a second transaction", async () => {
  const user = userEvent.setup();
  let allowance = BigInt(0);
  const rpc = jest.mocked(publicClientsFromIds[1].readContract);
  const read = rpc.getMockImplementation()!;
  rpc.mockImplementation(async (args) =>
    args.functionName === "allowance" ? allowance : read(args),
  );
  sendTransactionAsync.mockResolvedValue(`0x${"ab".repeat(32)}`);
  const receipt = jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockRejectedValue(new Error("Unexpected RPC internals"));
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not approve the token. Please try again.",
      }),
    ),
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Retry" }),
  ).not.toBeInTheDocument();
  allowance = BigInt("1000000000000000000");
  receipt.mockResolvedValue({
    status: "success",
    transactionHash: `0x${"ab".repeat(32)}`,
    blockNumber: BigInt(101),
  } as never);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("keeps a rejected wallet request out of the next step", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockRejectedValue(
    Object.assign(new Error("User rejected the request"), { code: 4001 }),
  );
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Request cancelled in your wallet." }),
    ),
  );
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(2);
});

it("submits unlimited approval directly from a nonzero insufficient allowance", async () => {
  const user = userEvent.setup();
  let allowance = BigInt("500000000000000000");
  const readContract = jest.mocked(publicClientsFromIds[1].readContract);
  const read = readContract.getMockImplementation()!;
  readContract.mockImplementation(async (args) =>
    args.functionName === "allowance" ? allowance : read(args),
  );
  sendTransactionAsync.mockImplementation(async ({ data }) => {
    const approval = decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data,
    });
    allowance = approval.args![1];
    return `0x${"ab".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"ab".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("radio", { name: "Unlimited" }));
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
  );
  expect(allowance).toBe(
    BigInt(
      "115792089237316195423570985008687907853269984665640564039457584007913129639935",
    ),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("retains a cancelled approval for explicit retry or abandonment", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue(`0x${"ab".repeat(32)}`);
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async ({ onReplaced }) => {
      const receipt = {
        status: "success",
        transactionHash: `0x${"cd".repeat(32)}`,
        blockNumber: BigInt(102),
      };
      onReplaced?.({
        reason: "cancelled",
        transactionReceipt: receipt,
      } as never);
      return receipt as never;
    });
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not approve the token. Please try again.",
      }),
    ),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  expect(
    screen.getByRole("button", { name: "Continue placement" }),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("shows a saved-storage error without crashing or sending a wallet request", async () => {
  localStorage.setItem(
    "stop-loss-placement",
    JSON.stringify({ state: { records: [] }, version: 99 }),
  );

  showCreation();

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not check the transaction. Please try again.",
      }),
    ),
  );
  expect(
    screen.getByRole("textbox", { name: "Sell amount" }),
  ).toBeInTheDocument();
  const user = userEvent.setup();
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
  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
});

it("keeps a late wallet response in its original account scope", async () => {
  const user = userEvent.setup();
  let finish!: (reference: string) => void;
  sendTransactionAsync.mockImplementation(
    () =>
      new Promise<string>((resolve) => {
        finish = resolve;
      }),
  );
  const view = showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() => expect(sendTransactionAsync).toHaveBeenCalledTimes(1));

  connectedAccount = "0x2222222222222222222222222222222222222222";
  view.refreshWallet();
  await act(async () => {
    finish("opaque-wallet-reference");
  });
  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Continue placement" }),
  ).not.toBeInTheDocument();

  connectedAccount = account;
  view.refreshWallet();
  expect(
    await screen.findByRole("button", { name: "Continue placement" }),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

it("does not open the old wallet request after waiting for a cross-tab lock", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue("opaque-wallet-reference");
  const view = showCreation();
  await reviewOneOrder(user);
  let entered!: () => void;
  const waiting = new Promise<void>((resolve) => {
    entered = resolve;
  });
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  requestLock = async (action) => {
    entered();
    await held;
    return action();
  };
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waiting;
  connectedAccount = "0x2222222222222222222222222222222222222222";
  view.refreshWallet();
  requestLock = async (action) => action();
  await act(async () => {
    release();
  });
  connectedAccount = account;
  view.refreshWallet();

  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
  expect(
    screen.queryByRole("button", { name: "Continue placement" }),
  ).not.toBeInTheDocument();
});

it("blocks an open review when saved storage becomes unreadable in another tab", async () => {
  const user = userEvent.setup();
  showCreation();
  await reviewOneOrder(user);

  await act(async () => {
    localStorage.setItem(
      "stop-loss-placement",
      JSON.stringify({ state: { records: [] }, version: 99 }),
    );
    window.dispatchEvent(
      new StorageEvent("storage", { key: "stop-loss-placement" }),
    );
  });

  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not check the transaction. Please try again.",
      }),
    ),
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
});

it("does not close a new review when the earlier wallet response arrives late", async () => {
  jest.useFakeTimers();
  try {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const owner = "0x4444444444444444444444444444444444444444";
    let schedule: unknown;
    let finish!: (hash: `0x${string}`) => void;
    const readContract = jest.mocked(publicClientsFromIds[1].readContract);
    const read = readContract.getMockImplementation()!;
    readContract.mockImplementation(async (args) => {
      if (args.functionName === "allowance")
        return BigInt(
          "115792089237316195423570985008687907853269984665640564039457584007913129639935",
        );
      if (args.functionName === "singleOrders") return !!schedule;
      if (args.functionName === "funded") return false;
      if (args.functionName === "schedules")
        return (
          schedule ?? [
            zeroAddress,
            BigInt(0),
            zeroAddress,
            zeroAddress,
            `0x${"00".repeat(32)}`,
            "0x",
          ]
        );
      return read(args);
    });
    sendTransactionAsync.mockImplementation(async ({ data }) => {
      const setup = decodeFunctionData({
        abi: parseAbi([
          "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
        ]),
        data,
      });
      const registration = decodeFunctionData({
        abi: parseAbi([
          "function registerFromShed((address handler,uint96 authEpoch,address funder,address owner,bytes32 salt,bytes staticInput) schedule) returns (bytes32 id)",
        ]),
        data: setup.args![0].at(-1)!.callData,
      }).args![0];
      expect(registration.owner.toLowerCase()).toBe(owner);
      schedule = [
        registration.handler,
        registration.authEpoch,
        registration.funder,
        registration.owner,
        registration.salt,
        registration.staticInput,
      ];
      return new Promise<`0x${string}`>((resolve) => {
        finish = resolve;
      });
    });
    showCreation();
    await reviewOneOrder(user, false);
    await user.click(screen.getByRole("button", { name: "Place order" }));
    await waitFor(() => expect(sendTransactionAsync).toHaveBeenCalledTimes(1));
    await act(async () => {
      await jest.advanceTimersByTimeAsync(10000);
    });
    expect(
      screen.queryByRole("region", { name: "Review stop-loss order" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: "Review Stop Loss order" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled(),
    );
    await act(async () => {
      finish(`0x${"ab".repeat(32)}`);
    });

    expect(
      screen.getByRole("region", { name: "Review stop-loss order" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
    expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

it("keeps a pending placement closed after returning to the page", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockResolvedValue("opaque-wallet-reference");
  showCreation();
  await reviewOneOrder(user);
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Approving…" })).toBeDisabled(),
  );
  await user.click(screen.getByRole("button", { name: "Edit order" }));
  await act(async () => {
    await resumeStopLossPlacement(account, 1);
  });
  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue placement" }),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

async function reviewOneOrder(
  user: ReturnType<typeof userEvent.setup>,
  approvalRequired = true,
  approvalLabel = "Approve WETH",
) {
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
  const review = await screen.findByRole("region", {
    name: "Review stop-loss order",
  });
  await waitFor(
    () =>
      expect(
        within(review).getByRole("button", {
          name: approvalRequired ? approvalLabel : "Place order",
        }),
      ).toBeEnabled(),
    { container: review },
  );
}

it("opens a wallet-scoped review with checked permissions and separate approval and placement", async () => {
  const user = userEvent.setup();
  showCreation();
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

  const dialog = await screen.findByRole("region", {
    name: "Review stop-loss order",
  });
  await waitFor(() => expect(dialog).toHaveTextContent("Approve WETH"));
  await waitFor(() =>
    expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled(),
  );
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  expect(
    within(dialog).getByText("Trigger price (USDC/WETH)"),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
});
