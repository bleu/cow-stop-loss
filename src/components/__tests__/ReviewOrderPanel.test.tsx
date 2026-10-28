/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

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
  };
}

it("shows a compact order summary with edit beside the heading", () => {
  render(<ReviewOrderPanel {...props()} prepared={prepared} checks={checks} />);
  const heading = screen.getByRole("heading", { name: "Confirm your order" });
  const edit = screen.getByRole("button", { name: "Edit order" });
  expect(edit.parentElement).toBe(heading.parentElement?.parentElement);
  expect(
    screen.getByLabelText("Show exact amount: 0.123456789012345678 WETH"),
  ).toHaveAttribute("title", "0.123456789012345678 WETH");
  expect(
    screen.getByLabelText("Show exact amount: 246.666665 USDC"),
  ).toBeInTheDocument();
  expect(screen.getByText("Execution account")).toBeInTheDocument();
  expect(screen.queryByText("Connected wallet")).not.toBeInTheDocument();
  expect(screen.queryByText(/Owner/)).not.toBeInTheDocument();
  expect(screen.queryByText("Wallet balance")).not.toBeInTheDocument();
  expect(screen.queryByText("Allowance needed")).not.toBeInTheDocument();
  expect(screen.queryByText("Settlement approval")).not.toBeInTheDocument();
  for (const [label, address] of [
    ["WETH oracle (2h max age)", order.tokenSellOracle],
    ["USDC oracle (2h max age)", order.tokenBuyOracle],
  ]) {
    expect(
      screen
        .getByText(label)
        .closest(".rescue-review-address")
        ?.querySelector("a"),
    ).toHaveAttribute("href", `https://etherscan.io/address/${address}`);
  }
});

it("keeps exact amounts and oracle help as inline keyboard controls", async () => {
  const user = userEvent.setup();
  render(<ReviewOrderPanel {...props()} />);
  const amount = screen.getByRole("button", {
    name: "Show exact amount: 0.123456789012345678 WETH",
  });
  const oracleHelp = screen.getByRole("button", {
    name: "About WETH oracle (2h max age)",
  });
  for (const control of [amount, oracleHelp]) {
    expect(control).toHaveClass("rescue-review-inline-control");
    expect(control).not.toHaveClass("pixel-control");
    expect(control).toHaveClass("focus-visible:ring-2");
  }
  act(() => oracleHelp.focus());
  expect(oracleHelp).toHaveFocus();
  expect(screen.getByRole("tooltip")).toHaveTextContent(
    "WETH price feed used to check the trigger price.",
  );
  await user.tab();
  expect(
    screen
      .getByText("WETH oracle (2h max age)")
      .closest(".rescue-review-address")
      ?.querySelector("a"),
  ).toHaveFocus();
  expect(
    screen.getByRole("link", { name: "WETH token contract" }),
  ).toHaveAttribute(
    "href",
    `https://etherscan.io/token/${order.tokenSell.address}`,
  );
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

it("keeps the same card elements while signing and pending", () => {
  const input = props();
  const { rerender } = render(
    <ReviewOrderPanel {...input} prepared={prepared} checks={checks} />,
  );
  const review = screen.getByRole("region", { name: "Review stop-loss order" });
  const elements = review.querySelectorAll("*").length;
  for (const state of [{ busy: true }, { pending: true }]) {
    rerender(
      <ReviewOrderPanel
        {...input}
        prepared={prepared}
        checks={checks}
        {...state}
      />,
    );
    expect(review.querySelectorAll("*")).toHaveLength(elements);
    expect(screen.getByRole("button", { name: "Approving…" })).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Retry" }),
    ).not.toBeInTheDocument();
  }
  rerender(<ReviewOrderPanel {...input} prepared={prepared} checks={checks} />);
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled();
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

it("does not render when closed and keeps the edit button next to the review title", () => {
  const input = props();
  const { rerender } = render(<ReviewOrderPanel {...input} open={false} />);
  expect(
    screen.queryByRole("region", { name: "Review stop-loss order" }),
  ).not.toBeInTheDocument();
  rerender(<ReviewOrderPanel {...input} />);
  const header = screen.getByRole("heading", { name: "Confirm your order" })
    .parentElement?.parentElement;
  expect(header?.lastElementChild).toHaveAccessibleName("Edit order");
});

it("keeps small nonzero amounts visible and reveals the full amount by touch", async () => {
  const user = userEvent.setup();
  render(
    <ReviewOrderPanel
      {...props()}
      order={{ ...order, amountSell: "0.000000000123456789" }}
    />,
  );
  const amount = screen.getByRole("button", {
    name: "Show exact amount: 0.000000000123456789 WETH",
  });
  expect(amount).toHaveTextContent("0.000000000123456789");
  await user.click(amount);
  expect(
    screen.getByRole("dialog", { name: "Exact token amount" }),
  ).toHaveTextContent("0.000000000123456789 WETH");
});

it.each([
  ["2000.123456789012345678", "2,000.1235"],
  ["0.000000000123456789", "0.000000000123456789"],
  ["123456789.123456789", "123,456,789.123"],
  ["2000.000012345678", "2,000"],
  ["0.00001234", "0.000012"],
  ["2000", "2,000"],
  ["94.544269912", "94.5443"],
])(
  "reveals the exact trigger price %s on click",
  async (strikePrice, compact) => {
    const user = userEvent.setup();
    render(<ReviewOrderPanel {...props()} order={{ ...order, strikePrice }} />);
    const price = screen.getByRole("button", {
      name: `Show exact trigger price: ${strikePrice} USDC / WETH`,
    });
    expect(screen.getByText("Trigger price (USDC/WETH)")).toBeInTheDocument();
    expect(price.textContent).toBe(compact);
    expect(price).toHaveAttribute("title", `${strikePrice} USDC / WETH`);
    await user.click(price);
    expect(
      screen.getByRole("dialog", { name: "Exact trigger price" }),
    ).toHaveTextContent(`${strikePrice} USDC / WETH`);
  },
);

it("reveals the exact trigger price with the keyboard and restores focus on close", async () => {
  const user = userEvent.setup();
  render(<ReviewOrderPanel {...props()} />);
  const price = screen.getByRole("button", {
    name: "Show exact trigger price: 2000 USDC / WETH",
  });
  price.focus();
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("dialog", { name: "Exact trigger price" }),
  ).toHaveTextContent("2000 USDC / WETH");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(price).toHaveFocus();
});

it("reveals high-precision amounts with the keyboard and restores focus on close", async () => {
  const user = userEvent.setup();
  render(<ReviewOrderPanel {...props()} />);
  const amount = screen.getByRole("button", {
    name: "Show exact amount: 0.123456789012345678 WETH",
  });
  amount.focus();
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("dialog", { name: "Exact token amount" }),
  ).toHaveTextContent("0.123456789012345678 WETH");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(amount).toHaveFocus();
});
