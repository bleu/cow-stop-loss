/**
 * @jest-environment jsdom
 */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import Page from "#/app/app/page";

jest.mock("#/components/StopLossCreation", () => {
  const { useState } = jest.requireActual<typeof import("react")>("react");
  return {
    StopLossCreation: ({ onReview }: { onReview?: () => void }) => {
      const [open, setOpen] = useState(false);
      return open ? (
        <section className="rescue-review" aria-label="Review stop-loss order">
          <button onClick={() => setOpen(false)}>Edit order</button>
        </section>
      ) : (
        <button
          onClick={() => {
            onReview?.();
            setOpen(true);
          }}
        >
          Review Stop Loss order
        </button>
      );
    },
  };
});

jest.mock("#/components/ConsolidatedOrdersTable", () => ({
  ConsolidatedOrdersTable: () => <h2 id="orders-title">Your orders</h2>,
}));

afterEach(() => jest.restoreAllMocks());

it.each([440, 620.5])(
  "captures the %spx portfolio height before review and measures again after editing",
  async (initialHeight) => {
    const user = userEvent.setup();
    const view = render(<Page />);
    const portfolio = screen.getByRole("region", { name: "Your orders" });
    const cards = portfolio.parentElement!;
    let formHeight = initialHeight;
    const bounds = portfolio.getBoundingClientRect();
    const measure = jest
      .spyOn(portfolio, "getBoundingClientRect")
      .mockImplementation(() => {
        expect(
          screen.queryByRole("region", { name: "Review stop-loss order" }),
        ).not.toBeInTheDocument();
        return { ...bounds, height: formHeight };
      });
    const capturedHeight = () =>
      cards.style.getPropertyValue("--rescue-review-table-height");

    expect(capturedHeight()).toBe("");
    expect(measure).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole("button", { name: "Review Stop Loss order" }),
    );

    expect(
      screen.getByRole("region", { name: "Review stop-loss order" }),
    ).toHaveClass("rescue-review");
    expect(capturedHeight()).toBe(`${initialHeight}px`);
    expect(measure).toHaveBeenCalledTimes(1);

    formHeight = 710;
    view.rerender(<Page />);
    expect(capturedHeight()).toBe(`${initialHeight}px`);
    expect(measure).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Edit order" }));

    expect(cards.querySelector(".rescue-review")).not.toBeInTheDocument();
    expect(measure).toHaveBeenCalledTimes(1);

    await user.click(
      screen.getByRole("button", { name: "Review Stop Loss order" }),
    );

    expect(capturedHeight()).toBe("710px");
    expect(measure).toHaveBeenCalledTimes(2);
  },
);
