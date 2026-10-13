/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import type { FundingSnapshot, PreparedPlacement } from "#/lib/pollerStopLoss";
import { DraftOrder, OrderStatus } from "#/lib/types";

import { ReviewOrdersDialog } from "../ReviewOrdersDialog";

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

it("links short addresses on the reviewed chain before preparation completes", async () => {
  const user = userEvent.setup();
  render(<ReviewOrdersDialog {...props()} chainId={100} />);

  const receiver = screen.getByRole("link", { name: "0x1111…1111" });
  expect(receiver).toHaveAttribute(
    "href",
    `https://gnosisscan.io/address/${order.receiver}`,
  );
  expect(receiver).toHaveAttribute("title", order.receiver);
  expect(receiver).toHaveAttribute("target", "_blank");
  await user.click(screen.getByText("Order and approval details"));
  const oracle = screen.getByRole("link", { name: "0x8888…8888" });
  expect(oracle).toHaveAttribute(
    "href",
    `https://gnosisscan.io/address/${order.tokenSellOracle}`,
  );
  expect(oracle).toHaveAttribute("title", order.tokenSellOracle);
});

it("shows the approval spender and links the full permission addresses in details", async () => {
  const user = userEvent.setup();
  render(
    <ReviewOrdersDialog {...props()} prepared={prepared} checks={checks} />,
  );

  const spender = within(
    screen.getByText("Approve 0.623456789012345678 WETH for the Poller."),
  ).getByRole("link", { name: "0xd808…6bB3" });
  expect(spender).toBeVisible();
  expect(spender).toHaveAttribute(
    "href",
    `https://etherscan.io/address/${prepared.poller}`,
  );
  expect(spender).toHaveAttribute("title", prepared.poller);
  await user.click(screen.getByText("Order and approval details"));
  const wallet = within(
    screen.getByRole("region", { name: "Wallet approval" }),
  );
  expect(wallet.getByRole("link", { name: "0x2222…2222" })).toHaveAttribute(
    "title",
    prepared.account,
  );
  expect(wallet.getByRole("link", { name: "0x6666…6666" })).toHaveAttribute(
    "href",
    `https://etherscan.io/token/${order.tokenSell.address}`,
  );
  const settlement = within(
    screen.getByRole("region", { name: "CowShed settlement approval" }),
  );
  expect(settlement.getByRole("link", { name: "0x4444…4444" })).toHaveAttribute(
    "title",
    prepared.owner,
  );
  expect(settlement.getByRole("link", { name: "0xC92E…0110" })).toHaveAttribute(
    "href",
    "https://etherscan.io/address/0xC92E8bdf79f0507f65a392b0ab4667716BFE0110",
  );
});

it("keeps funding totals collapsed but approval and settlement disclosures visible", async () => {
  const user = userEvent.setup();
  render(
    <ReviewOrdersDialog {...props()} prepared={prepared} checks={checks} />,
  );

  expect(screen.getByText("Wallet balance")).not.toBeVisible();
  expect(screen.getByText("Outstanding unfunded orders")).not.toBeVisible();
  expect(screen.getByText("Maximum oracle age")).not.toBeVisible();
  expect(
    screen.getByText("Approve 0.623456789012345678 WETH for the Poller."),
  ).toBeVisible();
  expect(
    screen.getByText(
      "Placement grants unlimited WETH settlement approval from the CowShed.",
    ),
  ).toBeVisible();
  await user.click(screen.getByText("Order and approval details"));
  expect(screen.getByText("Wallet balance")).toBeVisible();
  expect(screen.getByText("Maximum oracle age")).toBeVisible();
});

it("reviews precise amounts, trigger, calculated limit, and slippage", () => {
  render(<ReviewOrdersDialog {...props()} />);

  expect(
    screen.getByRole("dialog", { name: "Review Stop Loss order" }),
  ).toBeInTheDocument();
  expect(screen.getByText("Sell exactly")).toBeInTheDocument();
  expect(screen.getByText("0.123456789012345678 WETH")).toBeInTheDocument();
  expect(screen.getByText("Receive at least")).toBeInTheDocument();
  expect(screen.getByText("246.666665 USDC")).toBeInTheDocument();
  expect(screen.getByText("Trigger price")).toBeInTheDocument();
  expect(screen.getByText("WETH = 2000 USDC")).toBeInTheDocument();
  expect(screen.getByText("Limit price")).toBeInTheDocument();
  expect(screen.getByText("WETH = 1998 USDC")).toBeInTheDocument();
  expect(screen.getByText("Slippage")).toBeInTheDocument();
  expect(screen.getByText("0.1%")).toBeInTheDocument();
});

it("preserves the receiver, expiry, oracle routes, oracle age, and partial-fill setting", () => {
  const { rerender } = render(<ReviewOrdersDialog {...props()} />);

  expect(screen.getByText("Receiver")).toBeInTheDocument();
  expect(screen.getByText("0x1111…1111")).toBeInTheDocument();
  expect(screen.getByText("Expiration date")).toBeInTheDocument();
  expect(screen.getByText("2030-01-01 00:00:00 UTC")).toBeInTheDocument();
  expect(screen.getByText("WETH oracle")).toBeInTheDocument();
  expect(screen.getByText("0x8888…8888")).toBeInTheDocument();
  expect(screen.getByText("USDC oracle")).toBeInTheDocument();
  expect(screen.getByText("0x9999…9999")).toBeInTheDocument();
  expect(screen.getByText("Maximum oracle age")).toBeInTheDocument();
  expect(screen.getByText("2 hours")).toBeInTheDocument();
  expect(screen.getByText("Partial fills")).toBeInTheDocument();
  expect(screen.getByText("Allowed")).toBeInTheDocument();

  rerender(
    <ReviewOrdersDialog
      {...props()}
      order={{ ...order, partiallyFillable: false }}
    />,
  );
  expect(screen.getByText("Not allowed (Fill or Kill)")).toBeInTheDocument();
});

it("shows the known funding total, outstanding orders, and wallet balance without rounding", () => {
  render(
    <ReviewOrdersDialog {...props()} prepared={prepared} checks={checks} />,
  );

  fireEvent.click(screen.getByText("Order and approval details"));
  const funding = within(screen.getByRole("region", { name: "Funding" }));
  expect(funding.getByText("Required allowance")).toBeInTheDocument();
  expect(funding.getByText("0.623456789012345678 WETH")).toBeInTheDocument();
  expect(funding.getByText("Outstanding unfunded orders")).toBeInTheDocument();
  expect(funding.getByText("0.5 WETH")).toBeInTheDocument();
  expect(funding.getByText("Wallet balance")).toBeInTheDocument();
  expect(funding.getByText("0.75 WETH")).toBeInTheDocument();
});

it("states the API indexing limit beside the funding total", () => {
  render(
    <ReviewOrdersDialog {...props()} prepared={prepared} checks={checks} />,
  );

  fireEvent.click(screen.getByText("Order and approval details"));
  const funding = within(screen.getByRole("region", { name: "Funding" }));
  expect(
    funding.getByText(
      "Funding totals use indexed orders and orders confirmed in this browser. Orders created elsewhere can be missing until the API indexes them.",
    ),
  ).toBeInTheDocument();
});

it("warns when combined commitments exceed the balance and states that funds are not reserved", () => {
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{
        ...checks,
        balance: BigInt("600000000000000000"),
        combinedCommitmentsExceedBalance: true,
      }}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Combined commitments exceed your wallet balance. Funds are not reserved.",
  );

  rerender(
    <ReviewOrdersDialog {...input} prepared={prepared} checks={checks} />,
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("discloses the token, owner, spender, and amount for both funding and settlement permissions", () => {
  render(
    <ReviewOrdersDialog {...props()} prepared={prepared} checks={checks} />,
  );

  fireEvent.click(screen.getByText("Order and approval details"));
  const walletApproval = within(
    screen.getByRole("region", { name: "Wallet approval" }),
  );
  expect(walletApproval.getByText("Token")).toBeInTheDocument();
  expect(walletApproval.getByText("WETH")).toBeInTheDocument();
  expect(walletApproval.getByText("0x6666…6666")).toBeInTheDocument();
  expect(walletApproval.getByText("Owner (wallet)")).toBeInTheDocument();
  expect(walletApproval.getByText("0x2222…2222")).toBeInTheDocument();
  expect(walletApproval.getByText("Spender (Poller)")).toBeInTheDocument();
  expect(walletApproval.getByText("0xd808…6bB3")).toBeInTheDocument();
  expect(
    walletApproval.getByText("0.623456789012345678 WETH"),
  ).toBeInTheDocument();
  expect(
    walletApproval.getByText(
      "Approve only the required total for this order and outstanding unfunded orders.",
    ),
  ).toBeInTheDocument();

  const settlementApproval = within(
    screen.getByRole("region", { name: "CowShed settlement approval" }),
  );
  expect(settlementApproval.getByText("Token")).toBeInTheDocument();
  expect(settlementApproval.getByText("WETH")).toBeInTheDocument();
  expect(settlementApproval.getByText("0x6666…6666")).toBeInTheDocument();
  expect(settlementApproval.getByText("Owner (CowShed)")).toBeInTheDocument();
  expect(settlementApproval.getByText("0x4444…4444")).toBeInTheDocument();
  expect(
    settlementApproval.getByText("Spender (Vault Relayer)"),
  ).toBeInTheDocument();
  expect(settlementApproval.getByText("0xC92E…0110")).toBeInTheDocument();
  expect(settlementApproval.getByText("Unlimited WETH")).toBeInTheDocument();
  expect(
    settlementApproval.getByText(
      "Place order permits the Vault Relayer to spend WETH held by this CowShed without an amount limit.",
    ),
  ).toBeInTheDocument();
});

it("requires a separate Place order action after approval becomes sufficient", async () => {
  const user = userEvent.setup();
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog {...input} prepared={prepared} checks={checks} />,
  );

  const approve = screen.getByRole("button", { name: "Approve WETH" });
  const place = screen.getByRole("button", { name: "Place order" });
  expect(approve).toBeEnabled();
  expect(place).toBeDisabled();
  await user.click(approve);
  expect(input.onApprove).toHaveBeenCalledTimes(1);
  expect(input.onPlace).not.toHaveBeenCalled();
  expect(input.setOpen).not.toHaveBeenCalled();

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{
        ...checks,
        currentAllowance: BigInt("623456789012345678"),
        approvalRequired: false,
      }}
    />,
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
  expect(input.onPlace).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Place order" }));
  expect(input.onPlace).toHaveBeenCalledTimes(1);
  expect(input.onApprove).toHaveBeenCalledTimes(1);
  expect(input.setOpen).not.toHaveBeenCalled();
});

it("keeps a higher sufficient allowance without claiming it will be reduced", () => {
  render(
    <ReviewOrdersDialog
      {...props()}
      prepared={prepared}
      checks={{
        ...checks,
        currentAllowance: BigInt("1000000000000000000"),
        approvalRequired: false,
      }}
    />,
  );

  fireEvent.click(screen.getByText("Order and approval details"));
  const walletApproval = within(
    screen.getByRole("region", { name: "Wallet approval" }),
  );
  expect(walletApproval.getByText("Current allowance")).toBeInTheDocument();
  expect(walletApproval.getByText("1 WETH")).toBeInTheDocument();
  expect(
    walletApproval.getByText(
      "Allowance is sufficient. Your existing allowance will not be reduced.",
    ),
  ).toBeInTheDocument();
  expect(walletApproval.queryByText("Approval amount")).not.toBeInTheDocument();
  expect(
    walletApproval.queryByText("0.623456789012345678 WETH"),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeEnabled();
});

it("requires a zero reset as an extra approval before approving and placing", async () => {
  const user = userEvent.setup();
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{ ...checks, currentAllowance: BigInt("100000000000000000") }}
      approvalStage="approval"
    />,
  );

  const reset = screen.getByRole("button", { name: "Reset WETH allowance" });
  expect(reset).toBeEnabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  expect(
    screen.getByText(
      "Reset the allowance to zero, then approve the required amount.",
    ),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByText("Order and approval details"));
  const walletApproval = within(
    screen.getByRole("region", { name: "Wallet approval" }),
  );
  expect(walletApproval.getByText("Reset allowance to")).toBeInTheDocument();
  expect(walletApproval.getByText("0 WETH")).toBeInTheDocument();
  expect(walletApproval.getByText("Approval after reset")).toBeInTheDocument();
  expect(
    walletApproval.getByText("0.623456789012345678 WETH"),
  ).toBeInTheDocument();
  await user.click(reset);
  expect(input.onApprove).toHaveBeenCalledTimes(1);
  expect(input.onPlace).not.toHaveBeenCalled();

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={checks}
      approvalStage="approval"
    />,
  );
  expect(
    screen.queryByRole("button", { name: "Reset WETH allowance" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Approve WETH" }));
  expect(input.onApprove).toHaveBeenCalledTimes(2);
  expect(input.onPlace).not.toHaveBeenCalled();
});

it("blocks unknown funding, shows its error, and retries only through the parent callback", async () => {
  const user = userEvent.setup();
  const input = props();
  render(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{
        status: "unknown",
        error: "Funding API returned an incomplete page.",
      }}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent(
    "Funding API returned an incomplete page.",
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  expect(
    screen.queryByRole("region", { name: "Funding" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByText("Order and approval details"));
  const walletApproval = within(
    screen.getByRole("region", { name: "Wallet approval" }),
  );
  expect(walletApproval.getByText("Unavailable")).toBeInTheDocument();
  expect(walletApproval.queryByText("Approval amount")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(input.onRetry).toHaveBeenCalledTimes(1);
  expect(input.onApprove).not.toHaveBeenCalled();
  expect(input.onPlace).not.toHaveBeenCalled();
  expect(input.setOpen).not.toHaveBeenCalled();
});

it("keeps a placement error visible and blocks actions until the parent retries", async () => {
  const user = userEvent.setup();
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog {...input} error="Price feed is stale." />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Price feed is stale.");
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(input.onRetry).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("alert")).toHaveTextContent("Price feed is stale.");

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{
        ...checks,
        currentAllowance: BigInt("1000000000000000000"),
        approvalRequired: false,
      }}
      error="Funding total changed. Review the order again."
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Funding total changed. Review the order again.",
  );
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  expect(input.onPlace).not.toHaveBeenCalled();
});

it("blocks both wallet actions while the prepared order or funding checks are missing", () => {
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog {...input} checks={checks} />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Preparing review...");
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();

  rerender(<ReviewOrdersDialog {...input} prepared={prepared} />);
  expect(screen.getByRole("status")).toHaveTextContent("Preparing review...");
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  expect(
    screen.queryByRole("region", { name: "Funding" }),
  ).not.toBeInTheDocument();
});

it("blocks approval, placement, and retry while busy without hiding errors", () => {
  const input = props();
  const { rerender } = render(
    <ReviewOrdersDialog {...input} prepared={prepared} checks={checks} busy />,
  );

  expect(screen.getByRole("status")).toHaveTextContent("Checking order...");
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{
        ...checks,
        currentAllowance: BigInt("1000000000000000000"),
        approvalRequired: false,
      }}
      busy
    />,
  );
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={{ status: "unknown", error: "Funding RPC unavailable." }}
      busy
    />,
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Funding RPC unavailable.",
  );
  expect(screen.getByRole("button", { name: "Retry" })).toBeDisabled();
});

it("blocks wallet actions while pending but lets the user retry tracking and close the controlled review", async () => {
  const user = userEvent.setup();
  const input = props();
  const pendingChecks = {
    ...checks,
    currentAllowance: BigInt("1000000000000000000"),
    approvalRequired: false,
  };
  const { rerender } = render(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={pendingChecks}
      pending
      error="Confirmation RPC unavailable."
    />,
  );

  expect(screen.getByRole("status")).toHaveTextContent(
    "Transaction pending. You can close this review. Tracking will continue.",
  );
  expect(screen.getByRole("alert")).toHaveTextContent(
    "Confirmation RPC unavailable.",
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Retry" }));
  expect(input.onRetry).toHaveBeenCalledTimes(1);

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={checks}
      pending
    />,
  );
  expect(screen.getByRole("button", { name: "Approve WETH" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Place order" })).toBeDisabled();
  await user.click(screen.getByRole("button", { name: "Close" }));
  expect(input.setOpen).toHaveBeenCalledWith(false);
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(input.onApprove).not.toHaveBeenCalled();
  expect(input.onPlace).not.toHaveBeenCalled();

  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={checks}
      pending
      open={false}
    />,
  );
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  rerender(
    <ReviewOrdersDialog
      {...input}
      prepared={prepared}
      checks={checks}
      pending
    />,
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Tracking will continue.",
  );
  expect(input.onApprove).not.toHaveBeenCalled();
  expect(input.onPlace).not.toHaveBeenCalled();
  expect(input.onRetry).toHaveBeenCalledTimes(1);
});
