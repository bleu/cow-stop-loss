/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import {
  encodeAbiParameters,
  Hex,
  keccak256,
  parseAbiParameters,
} from "viem";
import { WagmiProvider } from "wagmi";

import { OrderDetails } from "#/components/OrderDetails";
import { COMPOSABLE_COW_ADDRESS, STOP_LOSS_ADDRESS } from "#/lib/contracts";
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

test("does not show approval repair controls in order details", async () => {
  showDetails();
  expect(
    await screen.findByRole("heading", { name: "Order details" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Update approval" }),
  ).not.toBeInTheDocument();
});
