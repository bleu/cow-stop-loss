/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { fireEvent, render, screen } from "@testing-library/react";

import type { FundingSnapshot, PreparedPlacement } from "#/lib/pollerStopLoss";
import { DraftOrder, OrderStatus } from "#/lib/types";

import { ReviewOrderPanel } from "../ReviewOrderPanel";

const order: DraftOrder = {
  id: "reviewed-order",
  tokenSell: {
    symbol: "WETH",
    decimals: 18,
    address: "0x6666666666666666666666666666666666666666",
  },
  tokenBuy: {
    symbol: "USDC",
    decimals: 6,
    address: "0x7777777777777777777777777777777777777777",
  },
  amountSell: "0.123456789012345678",
  amountBuy: "246.666665",
  strikePrice: "2000",
  limitPrice: "1998",
  slippagePercent: "0.1",
  isSellOrder: true,
  receiver: "0x1111111111111111111111111111111111111111",
  partiallyFillable: true,
  maxHoursSinceOracleUpdates: 2,
  validTo: 1893456000,
  salt: `0x${"ab".repeat(32)}`,
  tokenSellOracle: "0x8888888888888888888888888888888888888888",
  tokenBuyOracle: "0x9999999999999999999999999999999999999999",
  oraclePrice: 2000,
  status: OrderStatus.DRAFT,
};

const prepared: PreparedPlacement = {
  account: "0x2222222222222222222222222222222222222222",
  chainId: 1,
  owner: "0x4444444444444444444444444444444444444444",
  factory: "0x3333333333333333333333333333333333333333",
  poller: "0xd8088f0d57dB91AC6404FB3a9723A890100a6bB3",
  scheduleId: `0x${"aa".repeat(32)}`,
  paramsHash: `0x${"bb".repeat(32)}`,
  orderDigest: `0x${"cc".repeat(32)}`,
  domainSeparator: `0x${"dd".repeat(32)}`,
  appDataHash: `0x${"ee".repeat(32)}`,
  fullAppData: "{}",
  staticInput: "0x",
  draft: order,
};

const checks: Extract<FundingSnapshot, { status: "known" }> = {
  status: "known",
  blockNumber: BigInt(20000001),
  blockTimestamp: 1800000000,
  outstandingSellAmount: BigInt("500000000000000000"),
  requiredAllowance: BigInt("623456789012345678"),
  requiredSettlementAllowance: BigInt("623456789012345678"),
  currentSettlementAllowance: BigInt(0),
  settlementApprovalRequired: true,
  currentAllowance: BigInt(0),
  balance: BigInt("750000000000000000"),
  approvalRequired: true,
  combinedCommitmentsExceedBalance: false,
};

function props() {
  return {
    chainId: 1 as const,
    order,
    open: true,
    setOpen: jest.fn(),
    onApprove: jest.fn(),
    onPlace: jest.fn(),
    onRetry: jest.fn(),
  };
}

it("shows a compact order summary with edit beside the heading", () => {
  render(<ReviewOrderPanel {...props()} prepared={prepared} checks={checks} />);
  const heading = screen.getByRole("heading", { name: "Confirm your order" });
  const edit = screen.getByRole("button", { name: "Edit order" });
  expect(edit.parentElement).toBe(heading.parentElement?.parentElement);
  const sellAmount = screen.getByText(/0\.123456789012345678/);
  const buyAmount = screen.getByText(/246\.666665/);
  expect(sellAmount).toHaveClass("text-sm");
  expect(sellAmount).toHaveTextContent("0.123456789012345678 WETH");
  expect(buyAmount).toHaveClass("text-sm");
  expect(buyAmount).toHaveTextContent("246.666665 USDC");
  expect(screen.getByText(/Smart account used to execute/)).toBeInTheDocument();
  expect(screen.queryByText("Connected wallet")).not.toBeInTheDocument();
  expect(screen.queryByText(/Owner/)).not.toBeInTheDocument();
});

it("shows one approval action until approval is sufficient, then one placement action", () => {
  const input = props();
  const { rerender } = render(
    <ReviewOrderPanel {...input} prepared={prepared} checks={checks} />,
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();

  rerender(
    <ReviewOrderPanel
      {...input}
      prepared={prepared}
      checks={{ ...checks, approvalRequired: false }}
    />,
  );
  expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Approve WETH" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Place order" }));
  expect(input.onPlace).toHaveBeenCalledTimes(1);
});

it("replaces placement with one retry action when settlement execution fails", () => {
  const input = props();
  render(
    <ReviewOrderPanel
      {...input}
      prepared={prepared}
      checks={checks}
      error="Settlement execution data is missing or inconsistent"
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Settlement execution data is missing or inconsistent",
  );
  expect(screen.getByRole("button", { name: "Retry" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Approve WETH" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(input.onRetry).toHaveBeenCalledTimes(1);
});

it("shows one validating action while preparation is busy", () => {
  render(
    <ReviewOrderPanel {...props()} prepared={prepared} checks={checks} busy />,
  );
  expect(screen.getByRole("button", { name: "Approving…" })).toBeDisabled();
  expect(
    screen.queryByRole("button", { name: "Place order" }),
  ).not.toBeInTheDocument();
});

it("does not show a second preparation message while validating", () => {
  render(<ReviewOrderPanel {...props()} busy />);
  expect(screen.getByRole("button", { name: "Validating…" })).toBeDisabled();
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
});

it("does not render when closed and puts the edit arrow before the review title", () => {
  const input = props();
  const { rerender } = render(<ReviewOrderPanel {...input} open={false} />);
  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  rerender(<ReviewOrderPanel {...input} />);
  const header = screen.getByRole("heading", { name: "Confirm your order" })
    .parentElement?.parentElement;
  expect(header?.firstElementChild).toHaveAccessibleName("Edit order");
});
