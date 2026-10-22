/** @jest-environment jsdom */

import { act, render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { parseUnits } from "viem";

import { useOrderList } from "#/hooks/useOrderList";
import { fetchOraclePairPrice } from "#/lib/oraclePrice";
import { loadOrderFundingHealth } from "#/lib/orderFundingHealth";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

import { OrderDetails } from "../OrderDetails";

jest.mock("wagmi", () => ({ useAccount: () => ({ address: "0x123" }) }));
jest.mock("#/hooks/useOrderList", () => ({ useOrderList: jest.fn() }));
jest.mock("#/lib/orderFundingHealth", () => ({
  loadOrderFundingHealth: jest.fn(),
}));
jest.mock("#/lib/oraclePrice", () => ({ fetchOraclePairPrice: jest.fn() }));
jest.mock("../CancelOrderDialog", () => ({ CancelOrderDialog: () => null }));
jest.mock("../OracleTokenPrice", () => ({ OracleTokenPrice: () => null }));
jest.mock("../TokenLogo", () => ({ TokenLogo: () => null }));
jest.mock("../NetworkLogo", () => ({ NetworkLogo: () => null }));

const order: StopLossOrder = {
  id: "order",
  parentId: "order",
  chainId: 1,
  owner: "0x1111111111111111111111111111111111111111",
  receiver: "0x1111111111111111111111111111111111111111",
  hash: `0x${"11".repeat(32)}`,
  status: OrderStatus.OPEN,
  funding: { kind: "direct" },
  sellAmount: parseUnits("1", 18),
  buyAmount: parseUnits("90", 6),
  sellToken: {
    address: "0x2222222222222222222222222222222222222222",
    symbol: "WETH",
    decimals: 18,
  },
  buyToken: {
    address: "0x3333333333333333333333333333333333333333",
    symbol: "USDC",
    decimals: 6,
  },
  strike: parseUnits("100", 18),
  limitPrice: "90",
  validTo: 2_000_000_000,
  partiallyFillable: false,
  isSellOrder: true,
  sellTokenPriceOracle: "0x4444444444444444444444444444444444444444",
  buyTokenPriceOracle: "0x5555555555555555555555555555555555555555",
  maxTimeSinceLastOracleUpdate: 3600,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};

async function showOrder(overrides: Partial<StopLossOrder> = {}) {
  jest.mocked(useOrderList).mockReturnValue({
    orders: [{ ...order, ...overrides, source: "api", canLink: true }],
    chains: [],
    isLoading: false,
    error: null,
    trackingError: undefined,
    mutate: jest.fn(),
  });
  await act(async () => {
    render(
      <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
        <OrderDetails orderId={order.parentId} chainId={order.chainId} />
      </SWRConfig>,
    );
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(loadOrderFundingHealth).mockResolvedValue({
    status: "known",
    source: "wallet",
    insufficientBalance: false,
    insufficientFundingApproval: false,
    insufficientSettlementApproval: false,
  });
  jest.mocked(fetchOraclePairPrice).mockResolvedValue(95);
});

test("shows recovery guidance without a funding error when below the limit", async () => {
  jest.mocked(fetchOraclePairPrice).mockResolvedValue(89);
  await showOrder();
  expect(
    await screen.findByText("Waiting for price recovery"),
  ).toBeInTheDocument();
  const notice = screen.getByText(/The price is below your limit/);
  expect(notice).toHaveTextContent(/Higher slippage on a new order/);
  expect(notice).not.toHaveTextContent(/89|90|100|WETH|USDC/);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: "GitHub ticket." }),
  ).not.toBeInTheDocument();
  expect(fetchOraclePairPrice).toHaveBeenCalledWith({
    chainId: order.chainId,
    route: {
      tokenSellOracle: order.sellTokenPriceOracle,
      tokenBuyOracle: order.buyTokenPriceOracle,
    },
    maxAge: order.maxTimeSinceLastOracleUpdate,
  });
});

test.each([90, 95])(
  "shows execution guidance at price %s with healthy funding",
  async (price) => {
    jest.mocked(fetchOraclePairPrice).mockResolvedValue(price);
    await showOrder();
    expect(
      await screen.findByText("Waiting for execution"),
    ).toBeInTheDocument();
    expect(screen.getByText(/order should execute soon/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "GitHub ticket." }),
    ).toHaveAttribute(
      "href",
      "https://github.com/bleu/cow-stop-loss/issues/new",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  },
);

test.each([100, 101])("shows no trigger notice at price %s", async (price) => {
  jest.mocked(fetchOraclePairPrice).mockResolvedValue(price);
  await showOrder();
  expect(screen.queryByText("Waiting for execution")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Waiting for price recovery"),
  ).not.toBeInTheDocument();
});

test.each([undefined, "invalid", "0"])(
  "does not claim readiness with limit %s",
  async (limitPrice) => {
    await showOrder({ limitPrice });
    expect(screen.queryByText("Waiting for execution")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Waiting for price recovery"),
    ).not.toBeInTheDocument();
  },
);

test("keeps funding errors when the oracle read fails or is stale", async () => {
  jest
    .mocked(fetchOraclePairPrice)
    .mockRejectedValue(new Error("Oracle price data is stale"));
  jest.mocked(loadOrderFundingHealth).mockResolvedValue({
    status: "known",
    source: "wallet",
    insufficientBalance: true,
    insufficientFundingApproval: true,
    insufficientSettlementApproval: true,
  });
  await showOrder();
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent("Not enough sell tokens in your wallet.");
  expect(alert).toHaveTextContent("Token approval is missing or too low.");
  expect(alert.querySelectorAll("li")).toHaveLength(2);
  expect(screen.queryByText("Waiting for execution")).not.toBeInTheDocument();
});

test("shows price guidance alongside wallet funding errors", async () => {
  jest.mocked(loadOrderFundingHealth).mockResolvedValue({
    status: "known",
    source: "wallet",
    insufficientBalance: true,
    insufficientFundingApproval: false,
    insufficientSettlementApproval: false,
  });
  await showOrder();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Not enough sell tokens in your wallet.",
  );
  expect(await screen.findByText("Waiting for execution")).toBeInTheDocument();
});

test.each([OrderStatus.FULFILLED, OrderStatus.CANCELLED, OrderStatus.EXPIRED])(
  "does not run health checks for %s orders",
  async (status) => {
    await showOrder({ status });
    expect(fetchOraclePairPrice).not.toHaveBeenCalled();
    expect(loadOrderFundingHealth).not.toHaveBeenCalled();
    expect(screen.queryByText("Waiting for execution")).not.toBeInTheDocument();
  },
);
