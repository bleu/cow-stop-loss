/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  decodeFunctionData,
  encodeAbiParameters,
  Hex,
  keccak256,
  maxUint256,
  parseAbi,
  parseAbiParameters,
  TransactionReceiptNotFoundError,
} from "viem";
import { WagmiProvider } from "wagmi";

import { OrderDetails } from "#/components/OrderDetails";
import { COMPOSABLE_COW_ADDRESS, STOP_LOSS_ADDRESS } from "#/lib/contracts";
import { refreshApprovalRepair } from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
import { createWagmiConfig } from "#/utils/wagmi";

const account = "0x1111111111111111111111111111111111111111";
const owner = "0x4444444444444444444444444444444444444444";
const factory = "0x3333333333333333333333333333333333333333";
const sellToken = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
const salt = `0x${"ab".repeat(32)}` as Hex;
const staticInput = encodeAbiParameters(
  parseAbiParameters(
    "address,address,uint256,uint256,bytes32,address,bool,bool,uint32,address,address,int256,uint32",
  ),
  [
    sellToken,
    "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    BigInt("1000000000000000000"),
    BigInt("1980000000"),
    `0x${"aa".repeat(32)}`,
    account,
    true,
    true,
    1800003600,
    "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    BigInt("2000000000000000000000"),
    3600,
  ],
);
const hash = keccak256(
  encodeAbiParameters(
    parseAbiParameters("(address handler,bytes32 salt,bytes staticInput)"),
    [{ handler: STOP_LOSS_ADDRESS, salt, staticInput }],
  ),
);
const parent = {
  eventId: "existing",
  chainId: 1,
  owner,
  resolvedOwner: account,
  handler: STOP_LOSS_ADDRESS,
  orderType: "StopLoss",
  status: "Active",
  salt,
  hash,
  staticInput,
  transaction: null,
  decodedParams: {
    receiver: account,
    sellToken,
    buyToken: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    sellAmount: "1000000000000000000",
    buyAmount: "1980000000",
    validTo: 1800003600,
    strike: "2000000000000000000000",
    isSellOrder: true,
    isPartiallyFillable: true,
    sellTokenPriceOracle: "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
    buyTokenPriceOracle: "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
    maxTimeSinceLastOracleUpdate: 3600,
  },
  discreteOrders: { items: [] },
};
let walletAllowance: bigint;
let extraParent: typeof parent | undefined;
let funded: boolean;
let child:
  | {
      orderUid: string;
      status: string;
      validTo: number;
      executedSellAmount: string;
      executedBuyAmount: string;
      executedFee: string;
    }
  | undefined;
let settlementAllowance: bigint;
let connectedAccount: `0x${string}`;
let connectedChain: number;
const sendTransactionAsync = jest.fn();
const originalFetch = global.fetch;
jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: connectedAccount,
    chainId: connectedChain,
    isConnected: true,
  }),
  useSendTransaction: () => ({ sendTransactionAsync }),
}));

beforeEach(() => {
  localStorage.clear();
  connectedAccount = account;
  connectedChain = 1;
  walletAllowance = BigInt(1);
  extraParent = undefined;
  funded = false;
  child = undefined;
  settlementAllowance = BigInt("1000000000000000000");
  sendTransactionAsync.mockReset();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (_name: string, action: () => unknown) => action(),
    },
  });
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
  serveParents();
  jest
    .spyOn(publicClientsFromIds[1], "getBlockNumber")
    .mockResolvedValue(BigInt(100));
  jest
    .spyOn(publicClientsFromIds[1], "getBlock")
    .mockResolvedValue({
      timestamp: BigInt(1800000000),
      transactions: [],
    } as never);
  jest.spyOn(publicClientsFromIds[1], "getTransaction").mockImplementation(
    async ({ hash }) =>
      ({
        hash,
        from: account,
        to: sellToken,
        value: BigInt(0),
        nonce: 7,
        blockNumber: null,
        input: sendTransactionAsync.mock.calls.at(-1)?.[0].data ?? "0x",
      }) as never,
  );
  jest.spyOn(publicClientsFromIds[1], "getBytecode").mockResolvedValue("0x01");
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, args }) => {
      if (
        functionName === "COW_SHED_FACTORY" ||
        functionName === "trustedExecutor"
      )
        return factory;
      if (functionName === "proxyOf") return owner;
      if (functionName === "COMPOSABLE_COW") return COMPOSABLE_COW_ADDRESS;
      if (functionName === "domainSeparator") return `0x${"ef".repeat(32)}`;
      if (functionName === "schedules") {
        if (
          extraParent &&
          Array.isArray(args) &&
          args[0] ===
            keccak256(
              encodeAbiParameters(
                parseAbiParameters("address,address,address,bytes32"),
                [account, STOP_LOSS_ADDRESS, owner, extraParent.salt],
              ),
            )
        )
          return [
            STOP_LOSS_ADDRESS,
            BigInt(0),
            account,
            owner,
            extraParent.salt,
            extraParent.staticInput,
          ];
        return [
          STOP_LOSS_ADDRESS,
          BigInt(0),
          account,
          owner,
          salt,
          staticInput,
        ];
      }
      if (functionName === "singleOrders") return true;
      if (functionName === "funded") return funded;
      if (functionName === "balanceOf") return BigInt("5000000000000000000");
      if (functionName === "allowance")
        return Array.isArray(args) && args[0] === owner
          ? settlementAllowance
          : walletAllowance;
      throw new Error(`Unexpected chain read ${functionName}`);
    });
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function serveParents() {
  global.fetch = jest.fn(async (url, init) => {
    if (!String(url).includes("programmatic-orders"))
      throw new Error("Repair must not upload app data");
    const { query, variables } = JSON.parse(String(init?.body));
    const mappings = query.includes("ownerMappings");
    return {
      ok: true,
      json: async () => ({
        data: {
          [mappings ? "ownerMappings" : "conditionalOrderGenerators"]: {
            items:
              mappings || variables.chain !== 1
                ? []
                : [
                    {
                      ...parent,
                      discreteOrders: { items: child ? [child] : [] },
                    },
                    ...(extraParent ? [extraParent] : []),
                  ],
            pageInfo: { hasNextPage: false, endCursor: null },
          },
        },
      }),
    } as Response;
  });
}
function showDetails(showOtherOrder = false) {
  const config = createWagmiConfig();
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const content = () => (
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <OrderDetails chainId={1} orderId="existing" />
        {showOtherOrder && <OrderDetails chainId={1} orderId="other" />}
      </QueryClientProvider>
    </WagmiProvider>
  );
  const view = render(content());
  return {
    ...view,
    queryClient,
    refreshWallet: () => view.rerender(content()),
  };
}

test("confirms a limited repair after receipt and permission checks without a placement row", async () => {
  const user = userEvent.setup();
  const submitted: { to: string; data: Hex }[] = [];
  sendTransactionAsync.mockImplementation(async (transaction) => {
    submitted.push(transaction);
    walletAllowance = BigInt("1000000000000000000");
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"cd".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(submitted).toHaveLength(1);
  expect(submitted[0].to).toBe(sellToken);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: submitted[0].data,
    }).args,
  ).toEqual([
    "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
    BigInt("1000000000000000000"),
  ]);
  expect(
    screen.queryByRole("button", { name: "Update approval" }),
  ).not.toBeInTheDocument();
  expect(localStorage.getItem("stop-loss-placement")).toBeNull();
  expect(
    screen.getByRole("definition", { name: "Order ID" }),
  ).toHaveTextContent("existing");
});

test("resumes a delayed repair after the review closes without another wallet request", async () => {
  const user = userEvent.setup();
  const submitted: Hex[] = [];
  const txHash = `0x${"cd".repeat(32)}` as Hex;
  let executed = false;
  sendTransactionAsync.mockImplementation(async ({ data }) => {
    submitted.push(data);
    return txHash;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async () => {
      if (!executed)
        throw new TransactionReceiptNotFoundError({ hash: txHash });
      return {
        status: "success",
        transactionHash: txHash,
        blockNumber: BigInt(101),
      } as never;
    });
  const view = showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText(/Approval transaction pending/),
  ).toBeInTheDocument();
  await user.keyboard("{Escape}");
  view.unmount();
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(await screen.findByRole("button", { name: "Retry" }));
  expect(submitted).toHaveLength(1);
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  executed = true;
  walletAllowance = BigInt("1000000000000000000");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(submitted).toHaveLength(1);
});

test("persists submitted identity before a receipt wait can outlive the review", async () => {
  const user = userEvent.setup();
  const txHash = `0x${"cd".repeat(32)}` as Hex;
  sendTransactionAsync.mockResolvedValue(txHash);
  let release!: () => void;
  const waiting = new Promise<void>((resolve) => {
    release = resolve;
  });
  const receipt = jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async () => {
      await waiting;
      throw new TransactionReceiptNotFoundError({ hash: txHash });
    });
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  await waitFor(() => expect(receipt).toHaveBeenCalled());
  try {
    expect(localStorage.getItem("stop-loss-approval-repair")).toContain(
      '"nonce":7',
    );
  } finally {
    await act(async () => release());
  }
});

test("finds a fee-only replacement mined while closed after the original hash disappears", async () => {
  const user = userEvent.setup();
  const originalHash = `0x${"cd".repeat(32)}` as Hex;
  const replacementHash = `0x${"de".repeat(32)}` as Hex;
  let submittedInput: Hex = "0x";
  let replaced = false;
  sendTransactionAsync.mockImplementation(async ({ data }) => {
    submittedInput = data;
    return originalHash;
  });
  const transaction = () => ({
    hash: originalHash,
    from: account,
    to: sellToken,
    input: submittedInput,
    value: BigInt(0),
    nonce: 7,
    blockNumber: null,
  });
  jest
    .spyOn(publicClientsFromIds[1], "getTransaction")
    .mockImplementation(async () => {
      if (replaced) throw new Error("Original transaction unavailable");
      return transaction() as never;
    });
  jest
    .mocked(publicClientsFromIds[1].getBlockNumber)
    .mockImplementation(async () => BigInt(replaced ? 101 : 100));
  jest
    .mocked(publicClientsFromIds[1].getBlock)
    .mockImplementation(
      async (options) =>
        ({
          timestamp: BigInt(1800000000),
          transactions:
            options?.includeTransactions && replaced
              ? [
                  {
                    ...transaction(),
                    hash: replacementHash,
                    blockNumber: BigInt(101),
                    gasPrice: BigInt(2),
                  },
                ]
              : [],
        }) as never,
    );
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async ({ hash: requested }) => {
      if (requested === replacementHash)
        return {
          status: "success",
          transactionHash: replacementHash,
          blockNumber: BigInt(101),
        } as never;
      throw new TransactionReceiptNotFoundError({ hash: originalHash });
    });
  const view = showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText(/Approval transaction pending/),
  ).toBeInTheDocument();
  await user.keyboard("{Escape}");
  view.unmount();
  replaced = true;
  walletAllowance = BigInt("1000000000000000000");
  showDetails();
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

test("keeps an opaque Safe proposal pending even when permission changes elsewhere", async () => {
  const user = userEvent.setup();
  const submitted: Hex[] = [];
  sendTransactionAsync.mockImplementation(async ({ data }) => {
    submitted.push(data);
    return "safe-proposal-123";
  });
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText(/Approval transaction pending/),
  ).toBeInTheDocument();
  walletAllowance = maxUint256;
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(screen.getByText(/Approval transaction pending/)).toBeInTheDocument();
  expect(
    screen.queryByText("Approval update confirmed."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  expect(submitted).toHaveLength(1);
  expect(localStorage.getItem("stop-loss-approval-repair")).toContain(
    "safe-proposal-123",
  );
});

test("repairs remaining settlement after wallet confirmation and a rejected settlement request", async () => {
  const user = userEvent.setup();
  settlementAllowance = BigInt(1);
  const submitted: { to: string; data: Hex }[] = [];
  let rejectSettlement = true;
  sendTransactionAsync.mockImplementation(async (transaction) => {
    submitted.push(transaction);
    if (transaction.to === sellToken) walletAllowance = maxUint256;
    else if (rejectSettlement)
      throw Object.assign(new Error("User rejected the request"), {
        code: 4001,
      });
    else settlementAllowance = maxUint256;
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"cd".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(screen.getByRole("radio", { name: "Unlimited" }));
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  await waitFor(() =>
    expect(
      screen.queryByRole("radio", { name: "Limited" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: submitted[0].data,
    }).args,
  ).toEqual(["0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3", maxUint256]);
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("User rejected");
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  rejectSettlement = false;
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit approval update" }),
    ).toBeEnabled(),
  );
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(submitted.map(({ to }) => to)).toEqual([sellToken, factory, factory]);
  const calls = decodeFunctionData({
    abi: parseAbi([
      "function executeOwnHooks((address target,uint256 value,bytes callData,bool allowFailure,bool isDelegateCall)[] calls) payable returns (address proxy)",
    ]),
    data: submitted[2].data,
  }).args![0];
  expect(calls).toHaveLength(1);
  expect(
    decodeFunctionData({
      abi: parseAbi([
        "function approve(address spender,uint256 amount) returns (bool)",
      ]),
      data: calls[0].callData,
    }).args,
  ).toEqual(["0xC92E8bdf79f0507f65a392b0ab4667716BFE0110", maxUint256]);
});

test("blocks unknown funding state and retries without showing a zero total", async () => {
  const user = userEvent.setup();
  const read = jest
    .mocked(publicClientsFromIds[1].readContract)
    .getMockImplementation()!;
  let unavailable = true;
  jest
    .mocked(publicClientsFromIds[1].readContract)
    .mockImplementation(async (args) => {
      if (unavailable && args.functionName === "allowance")
        throw new Error("Allowance RPC unavailable");
      return read(args);
    });
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Allowance RPC unavailable",
  );
  expect(screen.queryByText("Required total: 0 WETH")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Submit approval update" }),
  ).not.toBeInTheDocument();
  unavailable = false;
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByText("Required total: 1 WETH")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeEnabled();
});

test("ignores a late approval review after the connected chain changes", async () => {
  const user = userEvent.setup();
  const read = jest
    .mocked(publicClientsFromIds[1].readContract)
    .getMockImplementation()!;
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  jest
    .mocked(publicClientsFromIds[1].readContract)
    .mockImplementation(async (args) => {
      if (args.functionName === "proxyOf") await pending;
      return read(args);
    });
  const view = showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  expect(
    await screen.findByText("Loading approval state..."),
  ).toBeInTheDocument();
  connectedChain = 100;
  view.refreshWallet();
  await act(async () => release());
  expect(
    screen.queryByRole("dialog", { name: "Update approval" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Update approval" }),
  ).not.toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
});

test("repairs only settlement for an already-funded partial order", async () => {
  const user = userEvent.setup();
  const identity = await refreshApprovalRepair({
    account,
    chainId: 1,
    owner,
    hash,
  });
  if (!identity.prepared) throw new Error("Funding identity unavailable");
  funded = true;
  settlementAllowance = BigInt("500000000000000000");
  child = {
    orderUid: `${identity.prepared.orderDigest}${owner.slice(2)}6b49e010`,
    status: "open",
    validTo: 1800003600,
    executedSellAmount: "250000000000000000",
    executedBuyAmount: "495000000",
    executedFee: "100000000000000000",
  };
  const submitted: { to: string; data: Hex }[] = [];
  sendTransactionAsync.mockImplementation(async (transaction) => {
    submitted.push(transaction);
    settlementAllowance = maxUint256;
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockResolvedValue({
      status: "success",
      transactionHash: `0x${"cd".repeat(32)}`,
      blockNumber: BigInt(101),
    } as never);
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  expect(
    await screen.findByText("Required remaining total: 0.75 WETH"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Wallet-to-Poller approval"),
  ).not.toBeInTheDocument();
  expect(
    screen.getByText(/Spender: 0xC92E8bdf79f0507f65a392b0ab4667716BFE0110/),
  ).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(submitted.map(({ to }) => to)).toEqual([factory]);
});

test("rejects changed approval calldata even when viem reports repriced", async () => {
  const user = userEvent.setup();
  let input: Hex = "0x";
  sendTransactionAsync.mockImplementation(async (transaction) => {
    input = transaction.data;
    walletAllowance = maxUint256;
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async ({ onReplaced }) => {
      const original = {
        from: account,
        to: sellToken,
        value: BigInt(0),
        input,
        nonce: 1,
      };
      onReplaced?.({
        reason: "repriced",
        replacedTransaction: original,
        transaction: {
          ...original,
          input: `${input.slice(0, -1)}2`,
          hash: `0x${"de".repeat(32)}`,
        },
      } as never);
      return {
        status: "success",
        transactionHash: `0x${"de".repeat(32)}`,
        blockNumber: BigInt(101),
      } as never;
    });
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "different action",
  );
  expect(
    screen.queryByText("Approval update confirmed."),
  ).not.toBeInTheDocument();
});

test("does not confirm a replaced repair action even if allowance is sufficient", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockImplementation(async () => {
    walletAllowance = maxUint256;
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(async ({ onReplaced }) => {
      onReplaced?.({ reason: "replaced" } as never);
      return {
        status: "success",
        transactionHash: `0x${"de".repeat(32)}`,
        blockNumber: BigInt(101),
      } as never;
    });
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Transaction replaced with a different action",
  );
  expect(
    screen.queryByText("Approval update confirmed."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Update approval" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByText("Approval update confirmed."),
  ).not.toBeInTheDocument();
});

test("hides approval repair when both finite permissions cover the order", async () => {
  walletAllowance = BigInt("1000000000000000000");
  settlementAllowance = BigInt("1000000000000000000");
  showDetails();
  await screen.findByRole("definition", { name: "Order ID" });
  await waitFor(() =>
    expect(
      screen.queryByRole("button", { name: "Update approval" }),
    ).not.toBeInTheDocument(),
  );
  expect(
    screen.queryByRole("button", { name: "Update approval" }),
  ).not.toBeInTheDocument();
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
});

test("retries a reverted approval only after reconciling its remaining permission", async () => {
  const user = userEvent.setup();
  const submitted: Hex[] = [];
  let reverted = true;
  sendTransactionAsync.mockImplementation(async ({ data }) => {
    submitted.push(data);
    if (!reverted) walletAllowance = BigInt("1000000000000000000");
    return `0x${"cd".repeat(32)}`;
  });
  jest
    .spyOn(publicClientsFromIds[1], "waitForTransactionReceipt")
    .mockImplementation(
      async () =>
        ({
          status: reverted ? "reverted" : "success",
          transactionHash: `0x${"cd".repeat(32)}`,
          blockNumber: BigInt(101),
        }) as never,
    );
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Transaction reverted",
  );
  expect(
    screen.queryByText("Approval update confirmed."),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  reverted = false;
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit approval update" }),
    ).toBeEnabled(),
  );
  expect(submitted).toHaveLength(1);
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText("Approval update confirmed."),
  ).toBeInTheDocument();
  expect(submitted).toHaveLength(2);
});

test("refreshes shared permissions for other orders on explicit Retry", async () => {
  const user = userEvent.setup();
  const otherSalt = `0x${"bc".repeat(32)}` as Hex;
  extraParent = {
    ...parent,
    eventId: "other",
    salt: otherSalt,
    hash: keccak256(
      encodeAbiParameters(
        parseAbiParameters("(address handler,bytes32 salt,bytes staticInput)"),
        [{ handler: STOP_LOSS_ADDRESS, salt: otherSalt, staticInput }],
      ),
    ),
  };
  settlementAllowance = BigInt("2000000000000000000");
  sendTransactionAsync.mockRejectedValue(
    Object.assign(new Error("User rejected the request"), { code: 4001 }),
  );
  showDetails(true);
  const updates = await screen.findAllByRole("button", {
    name: "Update approval",
  });
  expect(updates).toHaveLength(2);
  await user.click(updates[0]);
  expect(await screen.findByText("Required total: 2 WETH")).toBeInTheDocument();
  await user.click(
    screen.getByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("User rejected");
  walletAllowance = BigInt("2000000000000000000");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.queryAllByRole("button", { name: "Update approval" }),
    ).toHaveLength(0),
  );
});

test("requires a new Retry after leaving and returning to a reconciled wallet scope", async () => {
  const user = userEvent.setup();
  sendTransactionAsync.mockRejectedValue(
    Object.assign(new Error("User rejected the request"), { code: 4001 }),
  );
  const view = showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("User rejected");
  await user.click(screen.getByRole("button", { name: "Retry" }));
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit approval update" }),
    ).toBeEnabled(),
  );
  connectedChain = 100;
  view.refreshWallet();
  connectedChain = 1;
  view.refreshWallet();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Submit approval update" }),
    ).toBeDisabled(),
  );
  expect(sendTransactionAsync).toHaveBeenCalledTimes(1);
});

test("reviews only deficient existing wallet permission with limited selected", async () => {
  const user = userEvent.setup();
  showDetails();
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  const dialog = await screen.findByRole("dialog", { name: "Update approval" });
  expect(within(dialog).getByRole("radio", { name: "Limited" })).toBeChecked();
  expect(
    within(dialog).getByText("Required total: 1 WETH"),
  ).toBeInTheDocument();
  expect(within(dialog).getByText("Target: 1 WETH")).toBeInTheDocument();
  expect(
    within(dialog).getByText(/0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3/),
  ).toBeInTheDocument();
  expect(
    within(dialog).queryByText("CowShed settlement approval"),
  ).not.toBeInTheDocument();
});
