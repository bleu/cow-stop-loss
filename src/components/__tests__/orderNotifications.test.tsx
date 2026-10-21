/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

import {
  OrderToaster,
  showOrderError,
  showOrderSuccess,
} from "../orderNotifications";

test("success toasts contain a usable order-details link and are not repeated", async () => {
  const order = {
    account: "0x1111111111111111111111111111111111111111",
    chainId: 1 as const,
    owner: "0x4444444444444444444444444444444444444444",
    hash: `0x${"ab".repeat(32)}`,
  };
  render(<OrderToaster />);
  act(() => {
    showOrderSuccess("place", order);
    showOrderSuccess("place", order);
  });
  const title = await screen.findByText("Order placed.");
  const link = screen.getByRole("link", { name: "View order" });
  expect(title).toBeInTheDocument();
  expect(title.parentElement).toHaveClass("flex", "items-center");
  expect(link.parentElement).toBe(title.parentElement);
  expect(link).toHaveClass(
    "border-transparent",
    "bg-transparent",
    "text-muted-foreground",
  );
  expect(screen.getAllByRole("link", { name: "View order" })).toHaveLength(1);
  expect(screen.getByRole("link", { name: "View order" })).toHaveAttribute(
    "href",
    `/1/${order.account}/${encodeURIComponent(`${order.owner}:${order.hash}`)}`,
  );
});

test("errors use short messages instead of RPC details", async () => {
  render(<OrderToaster />);
  act(() => {
    showOrderError(
      "cancel",
      new Error("ContractFunctionExecutionError: internal RPC stack trace"),
    );
  });
  expect(
    await screen.findByText("Could not cancel the order. Please try again."),
  ).toBeInTheDocument();
  expect(
    screen.queryByText(/ContractFunctionExecutionError/),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Dismiss notification" }));
  await waitFor(() =>
    expect(
      screen.queryByText("Could not cancel the order. Please try again."),
    ).not.toBeInTheDocument(),
  );
});

test("the app toast viewport has a vertical anchor on desktop", () => {
  const { container } = render(<OrderToaster />);
  const viewport = container.querySelector("ol");
  expect(viewport?.className).toMatch(/sm:(top-0|bottom-0)/);
});
