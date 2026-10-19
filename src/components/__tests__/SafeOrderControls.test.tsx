/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

import { getSafeOrderControls } from "#/hooks/useStopLossApprovalRepair";
import { publicClientsFromIds } from "#/lib/publicClients";
import { buildCancellation } from "#/lib/stopLossCancellation";
import { type StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

import { ApprovalRepair } from "../ApprovalRepair";
import { CancelOrderDialog } from "../CancelOrderDialog";

const account = "0x1111111111111111111111111111111111111111";
const hash = `0x${"ab".repeat(32)}` as const;
const rpcRequest = jest.fn();
const originalFetch = global.fetch;
const order: StopLossOrder = {
  id: "safe:order",
  parentId: "safe:order",
  chainId: 1,
  owner: account,
  hash,
  validTo: 4102444800,
  status: OrderStatus.OPEN,
  isSellOrder: true,
  receiver: account,
  sellAmount: BigInt(100),
  buyAmount: BigInt(200),
  strike: BigInt(2),
  partiallyFillable: true,
  sellToken: { address: account, decimals: 18, symbol: "WETH" },
  buyToken: { address: account, decimals: 6, symbol: "USDC" },
  sellTokenPriceOracle: account,
  buyTokenPriceOracle: account,
  maxTimeSinceLastOracleUpdate: 3600,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};
jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    address: account,
    chainId: 1,
    connector: {
      id: "walletConnect",
      getProvider: async () => ({ request: rpcRequest }),
    },
  }),
  useConfig: () => ({}),
  useSendTransaction: () => ({
    sendTransactionAsync: () => {
      throw new Error("Safe must not use the EOA sender");
    },
  }),
}));
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: async (_name: string, action: () => unknown) => action(),
    },
  });
  rpcRequest.mockReset().mockImplementation(async ({ method }) => {
    if (method === "wallet_getCapabilities")
      return { "0x1": { atomic: { status: "supported" } } };
    if (method === "eth_chainId") return "0x1";
    if (method === "eth_accounts") return [account];
    if (method === "wallet_sendCalls") return { id: hash };
    throw new Error(`Unexpected wallet call: ${method}`);
  });
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      safe: account,
      safeTxHash: hash,
      nonce: "1",
      isExecuted: false,
      isSuccessful: null,
      transactionHash: null,
      results: [],
    }),
  })) as unknown as typeof fetch;
  const client = publicClientsFromIds[1];
  jest.spyOn(client, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest
    .spyOn(client, "getBytecode")
    .mockResolvedValue(
      "0x608060405273ffffffffffffffffffffffffffffffffffffffff600054167fa619486e0000000000000000000000000000000000000000000000000000000060003514156050578060005260206000f35b3660008037600080366000845af43d6000803e60008114156070573d6000fd5b3d6000f3fea264697066735822122003d1488ee65e08fa41e58e888a9865554c535f2c77126a82cb4c0f917f31441364736f6c63430007060033",
    );
  jest
    .spyOn(client, "getStorageAt")
    .mockResolvedValue(
      `0x${"00".repeat(12)}41675c099f32341bf84bfc5382af534df5c7461a`,
    );
  jest
    .spyOn(client, "readContract")
    .mockImplementation(async ({ functionName }) => {
      if (functionName === "singleOrders") return true;
      if (functionName === "allowance") return BigInt(0);
      throw new Error(`Unexpected RPC: ${functionName}`);
    });
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});
function show(content: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SWRConfig value={{ provider: () => new Map() }}>{content}</SWRConfig>
    </QueryClientProvider>,
  );
}
test("a previous confirmed cancellation does not close review for a recreated indexed order", async () => {
  const user = userEvent.setup();
  const controls = getSafeOrderControls();
  const prepared = await buildCancellation({ account, order });
  await controls.submitCancellation(prepared, async () => ({
    id: hash,
    kind: "proposal",
  }));
  const read = jest
    .mocked(publicClientsFromIds[1].readContract)
    .getMockImplementation()!;
  jest
    .mocked(publicClientsFromIds[1].readContract)
    .mockImplementation(async (args) =>
      args.functionName === "singleOrders" ? false : read(args),
    );
  global.fetch = jest.fn(async () => ({
    ok: true,
    json: async () => ({
      safe: account,
      safeTxHash: hash,
      nonce: "1",
      isExecuted: true,
      isSuccessful: true,
      transactionHash: hash,
    }),
  })) as unknown as typeof fetch;
  await controls.refresh({ account, chainId: 1 });
  jest.mocked(publicClientsFromIds[1].readContract).mockImplementation(read);
  show(
    <CancelOrderDialog
      order={{ ...order, id: "new-creation", parentId: "new-creation" }}
    />,
  );
  await user.click(
    screen.getByRole("button", { name: /Cancel order new-creation/ }),
  );
  expect(await screen.findByRole("dialog")).toBeVisible();
  expect(
    screen.getByRole("button", { name: "Confirm cancellation" }),
  ).toBeEnabled();
});

test.each(["cancel", "approve"] as const)(
  "does not open the old Safe wallet for %s after unmount during capability checks",
  async (action) => {
    const user = userEvent.setup();
    let release!: (value: unknown) => void;
    const capabilities = new Promise((resolve) => {
      release = resolve;
    });
    const request = rpcRequest.getMockImplementation()!;
    rpcRequest.mockImplementation(async (args) =>
      args.method === "wallet_getCapabilities" ? capabilities : request(args),
    );
    const view = show(
      action === "cancel" ? (
        <CancelOrderDialog order={order} />
      ) : (
        <ApprovalRepair order={order} onRefresh={() => undefined} />
      ),
    );
    await user.click(
      await screen.findByRole("button", {
        name:
          action === "cancel" ? /Cancel order safe:order/ : "Update approval",
      }),
    );
    await user.click(
      await screen.findByRole("button", {
        name:
          action === "cancel"
            ? "Confirm cancellation"
            : "Submit approval update",
      }),
    );
    await waitFor(() =>
      expect(
        rpcRequest.mock.calls.some(
          ([request]) => request.method === "wallet_getCapabilities",
        ),
      ).toBe(true),
    );
    view.unmount();
    await act(async () => {
      release({ "0x1": { atomic: { status: "supported" } } });
    });
    expect(
      rpcRequest.mock.calls.filter(
        ([request]) =>
          request.method === "wallet_sendCalls" ||
          request.method === "eth_sendTransaction",
      ),
    ).toHaveLength(0);
  },
);

test("Safe approval review sends a vault relayer proposal and retains its pending state", async () => {
  const user = userEvent.setup();
  const view = show(
    <ApprovalRepair order={order} onRefresh={() => undefined} />,
  );
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  expect(
    await screen.findByText("Safe settlement approval"),
  ).toBeInTheDocument();
  await user.click(
    await screen.findByRole("button", { name: "Submit approval update" }),
  );
  expect(
    await screen.findByText("Approval awaiting signatures."),
  ).toBeInTheDocument();
  view.unmount();
  show(<ApprovalRepair order={order} onRefresh={() => undefined} />);
  await user.click(
    await screen.findByRole("button", { name: "Update approval" }),
  );
  expect(
    await screen.findByText("Approval awaiting signatures."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Submit approval update" }),
  ).toBeDisabled();
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(1);
});

test("Safe cancellation shows the accepted proposal after closing and reopening the dialog", async () => {
  const user = userEvent.setup();
  const view = show(<CancelOrderDialog order={order} />);
  await user.click(
    screen.getByRole("button", { name: /Cancel order safe:order/ }),
  );
  await user.click(
    screen.getByRole("button", { name: "Confirm cancellation" }),
  );
  expect(
    await screen.findByText("Cancellation awaiting signatures."),
  ).toBeInTheDocument();
  view.unmount();
  show(<CancelOrderDialog order={order} />);
  await user.click(
    screen.getByRole("button", { name: /Cancel order safe:order/ }),
  );
  expect(
    await screen.findByText("Cancellation awaiting signatures."),
  ).toBeInTheDocument();
  expect(
    rpcRequest.mock.calls.filter(
      ([request]) => request.method === "wallet_sendCalls",
    ),
  ).toHaveLength(1);
});
