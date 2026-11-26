/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({ address: account, chainId: 4663, isConnected: true }),
  useSendTransaction: () => ({ sendTransactionAsync }),
}));

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";
import {
  decodeFunctionData,
  maxUint256,
  parseEther,
  type ReadContractParameters,
  zeroAddress,
  zeroHash,
} from "viem";

import { useDraftOrder } from "#/hooks/useDraftOrder";
import { composableCowAbi } from "#/lib/abis/composableCow";
import { composableCowPollerAbi } from "#/lib/abis/composableCowPoller";
import { cowShedFactoryAbi } from "#/lib/abis/cowShedFactory";
import { invalidatePlacementReads } from "#/lib/placementReads";
import { assertPlacementRoute } from "#/lib/pollerStopLoss";
import { publicClientsFromIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import { decodeStopLossStaticInput } from "#/lib/staticInputDecoder";
import { encodeStopLossStaticInput } from "#/lib/staticInputEncoder";
import { getSupportedTokens } from "#/lib/supportedTokens";

import { StopLossCreation } from "../StopLossCreation";
import { SwapCard } from "../swap-card/SwapCard";

const account = "0x1111111111111111111111111111111111111111";
const weth = "0x0bd7d308f8e1639fab988df18a8011f41eacad73";
const mu = "0xff080c8ce2e5feadaca0da81314ae59d232d4afd";
const usdg = "0x5fc5360d0400a0fd4f2af552add042d716f1d168";
const muOracle = "0x425eefdcf05ed6526c3ce61af99429a228a6d596";
const usdgOracle = "0x61b7e5650328764b076a108eff5fa7282a1b9ad2";
const poller = "0xd8088f0d57db91ac6404fb3a9723a890100a6bb3";
const factory = "0x221c28ec177cf7da6f837dfd0052ba8f265fb4ca";
const owner = "0x4444444444444444444444444444444444444444";
const composableCow = "0xfdafc9d1902f4e0b84f65f49f244b32b31013b74";
const sendTransactionAsync = jest.fn();
const originalFetch = global.fetch;
const rpc = publicClientsFromIds[4663];

function renderPilot(view = <SwapCard />) {
  return render(
    <SWRConfig value={{ provider: () => new Map() }}>{view}</SWRConfig>,
  );
}

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  Element.prototype.scrollIntoView = jest.fn();
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

beforeEach(() => {
  invalidatePlacementReads({ account, chainId: 4663 });
  jest.spyOn(rpc, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest
    .spyOn(rpc, "readContract")
    .mockRejectedValue(new Error("No fixture price"));
  jest.spyOn(rpc, "getBlock").mockResolvedValue({
    number: BigInt(100),
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
  } as Awaited<ReturnType<typeof rpc.getBlock>>);
  jest.spyOn(rpc, "multicall").mockImplementation(async ({ contracts }) =>
    contracts.map((contract) => {
      const { address, functionName } = contract as ReadContractParameters;
      return functionName === "balanceOf"
        ? {
            status: "success" as const,
            result:
              address === weth || address === mu ? parseEther("2") : BigInt(0),
          }
        : { status: "failure" as const, error: new Error("No fixture price") };
    }),
  );
});

it("lets a Robinhood wallet select WETH with its balance and shows USDG as the buy token", async () => {
  const user = userEvent.setup();
  renderPilot();
  expect(screen.getByRole("img", { name: "USDG token" })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Select token" }));
  expect(await screen.findByRole("option", { name: /\bMU\b/ })).toBeVisible();
  await user.click(screen.getByRole("option", { name: /\bWETH\b/ }));
  expect(await screen.findByText("Balance: 2")).toBeVisible();
});

function draftWithRoundAges({ sell, buy }: { sell: number; buy: number }) {
  const timestamp = BigInt(Date.parse("2026-11-28T01:00:00Z") / 1000);
  jest
    .mocked(rpc.getBlock)
    .mockResolvedValue({ number: BigInt(100), timestamp } as never);
  jest
    .mocked(rpc.readContract)
    .mockImplementation(async ({ address, functionName, blockNumber }) => {
      if (blockNumber !== BigInt(100))
        throw new Error("Expected the pinned block");
      if (functionName === "decimals") return 8;
      if (
        functionName === "latestRoundData" &&
        (address === muOracle || address === usdgOracle)
      ) {
        const isSell = address === muOracle;
        const updated = timestamp - BigInt(isSell ? sell : buy);
        return [
          BigInt(1),
          BigInt(isSell ? 10000000000 : 100000000),
          updated,
          updated,
          BigInt(1),
        ];
      }
      throw new Error(`Unexpected RPC read: ${functionName} at ${address}`);
    });
  const { sellTokens, buyToken } = getSupportedTokens(4663);
  const stock = sellTokens.find(({ token }) => token.address === mu);
  if (!stock) throw new Error("MU is unavailable");
  return useDraftOrder.getState().createDraftOrder(
    {
      tokenSell: stock.token,
      tokenBuy: buyToken.token,
      amountSell: "1",
      amountBuy: "89",
      strikePrice: "90",
      slippagePercent: "1",
      isSellOrder: true,
      validTo: VALID_TO_OPTIONS.DAY,
    },
    4663,
    account,
  );
}

it.each([
  ["MU", { sell: 86401, buy: 3600 }],
  ["USDG", { sell: 3600, buy: 86401 }],
] as const)(
  "rejects a Robinhood draft when only %s is stale",
  async (_token, ages) => {
    await expect(draftWithRoundAges(ages)).rejects.toThrow(
      /oracle price data is stale/i,
    );
  },
);

it("rejects a restored Stock Token order with an encoded timeout above one day", async () => {
  const draft = await draftWithRoundAges({ sell: 3600, buy: 3600 });
  const staticInput = encodeStopLossStaticInput(
    { ...draft, maxHoursSinceOracleUpdates: 25 },
    zeroHash,
  );
  expect(() => assertPlacementRoute(draft, 4663, staticInput)).toThrow(
    /86400 seconds/i,
  );
});

it("reviews a fresh Stock Token after close and requests CowShed setup only on confirmation", async () => {
  const now = Date.parse("2026-11-28T01:00:00Z");
  const timestamp = BigInt(now / 1000);
  jest.spyOn(Date, "now").mockReturnValue(now);
  jest
    .mocked(rpc.getBlock)
    .mockResolvedValue({ number: BigInt(100), timestamp } as never);
  jest.spyOn(rpc, "getBlockNumber").mockResolvedValue(BigInt(100));
  jest.spyOn(rpc, "getBytecode").mockResolvedValue("0x01");
  jest
    .mocked(rpc.readContract)
    .mockImplementation(async ({ address, functionName }) => {
      const target = address?.toLowerCase();
      switch (functionName) {
        case "COW_SHED_FACTORY":
          if (target === poller) return factory;
          break;
        case "proxyOf":
          if (target === factory) return owner;
          break;
        case "trustedExecutor":
          return factory;
        case "COMPOSABLE_COW":
          return composableCow;
        case "domainSeparator":
          return `0x${"ef".repeat(32)}`;
        case "balanceOf":
          return parseEther("2");
        case "allowance":
          return maxUint256;
        case "singleOrders":
          return false;
        case "schedules":
          return [
            zeroAddress,
            BigInt(0),
            zeroAddress,
            zeroAddress,
            zeroHash,
            "0x",
          ];
        case "decimals":
          return 8;
        case "latestRoundData": {
          const updated = timestamp - BigInt(3600);
          if (target === muOracle || target === usdgOracle)
            return [
              BigInt(1),
              BigInt(target === muOracle ? 10000000000 : 100000000),
              updated,
              updated,
              BigInt(1),
            ];
          break;
        }
      }
      throw new Error(`Unexpected RPC read: ${functionName} at ${address}`);
    });
  const fetch = jest.fn(
    async (input: Parameters<typeof global.fetch>[0], init?: RequestInit) => {
      const url = String(input);
      if (url.startsWith("https://api.cow.fi/robinhood/api/v1/app_data/"))
        return { ok: true, json: async () => url.split("/").pop() } as Response;
      if (url === "https://api.cow.fi/robinhood/api/v1/quote")
        return {
          ok: true,
          json: async () => ({ quote: { buyAmount: "99000000" } }),
        } as Response;
      if (url.includes("programmatic-orders")) {
        const { query } = JSON.parse(String(init?.body));
        const field = query.includes("ownerMappings")
          ? "ownerMappings"
          : "conditionalOrderGenerators";
        return {
          ok: true,
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
      throw new Error(`Unexpected request: ${url}`);
    },
  );
  global.fetch = fetch;
  Object.defineProperty(navigator, "locks", {
    configurable: true,
    value: {
      request: (_name: string, action: () => unknown) =>
        Promise.resolve().then(action),
    },
  });
  localStorage.clear();
  sendTransactionAsync
    .mockReset()
    .mockRejectedValue(new Error("User rejected the request"));

  const user = userEvent.setup();
  renderPilot(<StopLossCreation />);
  await user.click(screen.getByRole("button", { name: "Select token" }));
  await user.click(await screen.findByRole("option", { name: /\bMU\b/ }));
  await user.type(screen.getByRole("textbox", { name: "Sell amount" }), "1");
  await user.type(screen.getByRole("textbox", { name: "Trigger price" }), "90");
  const reviewButton = screen.getByRole("button", {
    name: "Review Stop Loss order",
  });
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith(
      "https://api.cow.fi/robinhood/api/v1/quote",
      expect.anything(),
    );
    expect(reviewButton).toBeEnabled();
  });
  const marketHoursWarning =
    /this Stock Token feed does not update outside its 24\/5 session/i;
  expect(screen.queryByText(marketHoursWarning)).not.toBeInTheDocument();
  await user.click(reviewButton);
  const review = await waitFor(() => {
    const error = screen.queryByRole("alert");
    if (error) throw new Error(error.textContent ?? "Review failed");
    return within(
      screen.getByRole("region", { name: "Review stop-loss order" }),
    );
  });
  expect(review.getByText(marketHoursWarning)).toBeVisible();
  expect(
    review.queryByText(/stop-loss can still execute after the market closes/i),
  ).not.toBeInTheDocument();
  const place = await review.findByRole("button", { name: "Place order" });
  expect(place).toBeEnabled();
  expect(sendTransactionAsync).not.toHaveBeenCalled();
  const upload = fetch.mock.calls.find(([url]) =>
    String(url).includes("/app_data/"),
  );
  const appData = JSON.parse(JSON.parse(String(upload?.[1]?.body)).fullAppData);
  expect(appData.metadata.hooks.pre).toHaveLength(1);
  expect(appData.metadata.hooks.pre[0].target.toLowerCase()).toBe(poller);
  expect(
    decodeFunctionData({
      abi: composableCowPollerAbi,
      data: appData.metadata.hooks.pre[0].callData,
    }).functionName,
  ).toBe("pollFunds");

  await user.click(place);
  await waitFor(() => expect(sendTransactionAsync).toHaveBeenCalledTimes(1));
  const [transaction] = sendTransactionAsync.mock.calls[0];
  expect(transaction).toMatchObject({ account, chainId: 4663, to: factory });
  const setup = decodeFunctionData({
    abi: cowShedFactoryAbi,
    data: transaction.data,
  });
  expect(setup.functionName).toBe("executeOwnHooks");
  if (setup.functionName !== "executeOwnHooks")
    throw new Error("Expected CowShed setup");
  const [calls] = setup.args;
  expect(calls.map(({ target }) => target.toLowerCase())).toEqual([
    composableCow,
    poller,
  ]);
  const create = decodeFunctionData({
    abi: composableCowAbi,
    data: calls[0].callData,
  });
  if (create.functionName !== "create")
    throw new Error("Expected a conditional order");
  const order = decodeStopLossStaticInput(create.args[0].staticInput);
  expect(order.sellToken.toLowerCase()).toBe(mu);
  expect(order.buyToken.toLowerCase()).toBe(usdg);
  expect(order.maxTimeSinceLastOracleUpdate).toBe(86400);
});
