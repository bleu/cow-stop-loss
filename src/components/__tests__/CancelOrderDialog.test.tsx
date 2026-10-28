/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { toast } from "@bleu/ui";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";

import {
  buildCancellation,
  CancellationRevertedError,
  observeCancellation,
} from "#/lib/stopLossCancellation";
import type { StopLossOrder } from "#/lib/stopLossOrders";
import { OrderStatus } from "#/lib/types";

import { CancelOrderDialog } from "../CancelOrderDialog";
import { OrderToaster } from "../orderNotifications";

const account = "0x1111111111111111111111111111111111111111";
const send = jest.fn();
const confirm = jest.fn();
jest.mock("@bleu/ui", () => ({
  ...jest.requireActual("@bleu/ui"),
  toast: jest.fn(),
}));
jest.mock("wagmi", () => ({
  useAccount: () => ({ address: account, chainId: 1 }),
  useConfig: () => ({}),
  useSendTransaction: () => ({ sendTransactionAsync: send }),
}));
jest.mock("wagmi/actions", () => ({
  getAccount: () => ({ address: account, chainId: 1 }),
}));
jest.mock("#/hooks/useOrderList", () => ({
  useCancellationOverlay: () => ({ confirm }),
}));
jest.mock("#/lib/stopLossCancellation", () => ({
  ...jest.requireActual("#/lib/stopLossCancellation"),
  buildCancellation: jest.fn(),
  observeCancellation: jest.fn(),
}));
const order: StopLossOrder = {
  id: "order-1",
  parentId: "order-1",
  chainId: 1,
  owner: "0x4444444444444444444444444444444444444444",
  receiver: account,
  hash: `0x${"ab".repeat(32)}`,
  status: OrderStatus.OPEN,
  sellToken: {
    symbol: "WETH",
    address: "0x2222222222222222222222222222222222222222",
    decimals: 18,
  },
  buyToken: {
    symbol: "USDC",
    address: "0x3333333333333333333333333333333333333333",
    decimals: 6,
  },
  sellAmount: BigInt("1000000000000000000"),
  buyAmount: BigInt("2000000000"),
  strike: BigInt("2000000000000000000000"),
  validTo: 1900000000,
  partiallyFillable: true,
  isSellOrder: true,
  sellTokenPriceOracle: account,
  buyTokenPriceOracle: account,
  maxTimeSinceLastOracleUpdate: 86400,
  executedSellAmount: null,
  executedBuyAmount: null,
  executedFee: null,
};
beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(buildCancellation).mockResolvedValue({
    account,
    order,
    hash: order.hash,
    blockNumber: BigInt(100),
    transaction: {
      account,
      chainId: 1,
      to: order.owner,
      value: BigInt(0),
      data: "0x",
    },
  } as Awaited<ReturnType<typeof buildCancellation>>);
  send.mockResolvedValue(`0x${"cd".repeat(32)}`);
  jest.mocked(observeCancellation).mockResolvedValue(true);
});
async function openReview() {
  render(<CancelOrderDialog order={order} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel order order-1 on Ethereum" }),
  );
  return screen.findByRole("dialog");
}
test("rounds review amounts half-up and keeps exact amounts and sub-base-unit rates on hover", async () => {
  const reviewedOrder = {
    ...order,
    sellAmount: BigInt("1234550000000000000"),
    buyAmount: BigInt("2000123450"),
    strike: BigInt("123456789"),
  };
  render(<CancelOrderDialog order={reviewedOrder} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Cancel order order-1 on Ethereum" }),
  );
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("1.2346 WETH")).toHaveAttribute(
    "title",
    "1.23455 WETH",
  );
  expect(within(dialog).getByText("2,000.1235 USDC")).toHaveAttribute(
    "title",
    "2000.12345 USDC",
  );
  expect(
    within(dialog).getByText("0.000000000123456789 USDC per WETH"),
  ).toHaveAttribute("title", "0.000000000123456789 USDC per WETH");
});

test("keeps the card stable while signing and pending, then closes with an order link toast", async () => {
  let sign!: (hash: string) => void;
  let mined!: (confirmed: boolean) => void;
  send.mockImplementation(
    () =>
      new Promise((resolve) => {
        sign = resolve;
      }),
  );
  jest.mocked(observeCancellation).mockImplementation(
    () =>
      new Promise((resolve) => {
        mined = resolve;
      }),
  );
  const dialog = await openReview();
  const elements = dialog.querySelectorAll("*").length;
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Waiting for wallet…" }),
    ).toBeDisabled(),
  );
  expect(dialog.querySelectorAll("*")).toHaveLength(elements);
  await act(async () => {
    sign(`0x${"cd".repeat(32)}`);
  });
  expect(
    within(dialog).getByRole("button", { name: "Cancelling…" }),
  ).toBeDisabled();
  expect(dialog.querySelectorAll("*")).toHaveLength(elements);
  await act(async () => {
    mined(true);
  });
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  expect(confirm).toHaveBeenCalledWith(account, order);
  const notification = jest.mocked(toast).mock.calls.at(-1)![0];
  expect(notification.title).toBe("Order cancelled.");
  expect(notification.action?.props.children.props.href).toBe(
    `/1/${account}/${order.parentId}`,
  );
});
test("restores the original action after rejection and shows only a short toast", async () => {
  send.mockRejectedValue(
    Object.assign(new Error("Low-level wallet error"), { code: 4001 }),
  );
  const dialog = await openReview();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Confirm cancellation" }),
    ).toBeEnabled(),
  );
  expect(toast).toHaveBeenCalledWith(
    expect.objectContaining({ title: "Request cancelled in your wallet." }),
  );
  expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  expect(dialog).not.toHaveTextContent("Retry");
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
});
test("wallet rejection displays the real toast while the cancel dialog stays open", async () => {
  jest
    .mocked(toast)
    .mockImplementationOnce(jest.requireActual("@bleu/ui").toast);
  send.mockRejectedValue(Object.assign(new Error("Rejected"), { code: 4001 }));
  render(<OrderToaster />);
  const dialog = await openReview();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  expect(
    await screen.findByText("Request cancelled in your wallet."),
  ).toBeVisible();
  expect(dialog).toBeVisible();
  expect(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  ).toBeEnabled();
});

test("the original action checks an uncertain transaction instead of sending again", async () => {
  jest
    .mocked(observeCancellation)
    .mockRejectedValue(new Error("RPC internals"));
  const dialog = await openReview();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() =>
    expect(toast).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Could not cancel the order. Please try again.",
      }),
    ),
  );
  jest.mocked(observeCancellation).mockResolvedValue(false);
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() => expect(observeCancellation).toHaveBeenCalledTimes(2));
  expect(send).toHaveBeenCalledTimes(1);
});
test("a reverted transaction allows a fresh submission from the original action", async () => {
  jest
    .mocked(observeCancellation)
    .mockRejectedValue(new CancellationRevertedError());
  const dialog = await openReview();
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() =>
    expect(
      within(dialog).getByRole("button", { name: "Confirm cancellation" }),
    ).toBeEnabled(),
  );
  fireEvent.click(
    within(dialog).getByRole("button", { name: "Confirm cancellation" }),
  );
  await waitFor(() => expect(send).toHaveBeenCalledTimes(2));
});
