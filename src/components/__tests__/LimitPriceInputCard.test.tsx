/** @jest-environment jsdom */

import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { getSupportedTokens } from "#/lib/supportedTokens";
import { TOOLTIP_DESCRIPTIONS } from "#/lib/tooltipDescriptions";
import type { SwapData } from "#/lib/types";

import { LimitPriceInputCard } from "../LimitPriceInputCard";
import { Form } from "../ui/form";

function LimitForm({
  onSubmit,
  missingToken,
}: {
  onSubmit: (data: SwapData) => void;
  missingToken?: "sell" | "buy";
}) {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const [defaultSlippage, setDefaultSlippage] = useState(true);
  const form = useForm<SwapData>({
    defaultValues: {
      strikePrice: "95",
      slippagePercent: "10",
      limitPriceSource: "slippage",
      limitPrice: "",
      tokenSell: missingToken === "sell" ? undefined : sellTokens[0].token,
      tokenBuy: missingToken === "buy" ? undefined : buyToken.token,
    },
  });
  return (
    <Form {...form} onSubmit={onSubmit}>
      <LimitPriceInputCard
        defaultSlippage={defaultSlippage}
        onManualEdit={() => setDefaultSlippage(false)}
        onResetToDefault={() => {
          setDefaultSlippage(true);
          form.setValue("limitPriceSource", "slippage");
          form.setValue("slippagePercent", "10");
        }}
      />
      <button type="submit">Submit</button>
    </Form>
  );
}

it.each([
  ["sell", "Price"],
  ["sell", "Slippage"],
  ["buy", "Price"],
  ["buy", "Slippage"],
] as const)(
  "hides the hint and default controls without a %s token in the %s view",
  async (missingToken, view) => {
    const user = userEvent.setup();
    render(<LimitForm onSubmit={jest.fn()} missingToken={missingToken} />);
    await user.click(screen.getByRole("button", { name: view }));
    const input = screen.getByRole("textbox", {
      name: view === "Price" ? "Limit price" : "Slippage tolerance (%)",
    });
    expect(input).toBeVisible();
    const footer = input.closest("section")?.lastElementChild;
    expect(footer).toHaveClass("h-5");
    expect(footer).toBeEmptyDOMElement();
    expect(screen.getByText("Limit price", { exact: true })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Switch to (Price|Slippage)/ }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Default", { exact: true }),
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute("aria-describedby", "limit-price-hint");
    await user.clear(input);
    await user.type(input, view === "Price" ? "94" : "2");
    expect(input.closest("section")?.lastElementChild).toBe(footer);
    expect(footer).toBeEmptyDOMElement();
    expect(
      screen.queryByText("Custom", { exact: true }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Switch to (Price|Slippage)/ }),
    ).not.toBeInTheDocument();
  },
);

it("switches views with keyboard hints without changing the stored constraint", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(<LimitForm onSubmit={onSubmit} />);
  const hint = screen.getByRole("button", { name: "Switch to Slippage" });
  expect(hint).toHaveTextContent("Slippage: 10%");
  expect(hint).toHaveClass("text-xs", "lg:text-[11px]");
  const footer = hint.parentElement;
  expect(footer).toHaveClass("h-5");
  expect(footer).toContainElement(screen.getByText("Default", { exact: true }));
  hint.focus();
  await user.keyboard("{Enter}");
  expect(
    screen.getByRole("textbox", { name: "Slippage tolerance (%)" }),
  ).toHaveValue("10");
  expect(screen.getByText("Limit price", { exact: true })).toBeVisible();
  expect(
    within(screen.getByRole("group", { name: "Limit input mode" })).getByRole(
      "button",
      { name: "Slippage" },
    ),
  ).toHaveAttribute("aria-pressed", "true");
  const back = screen.getByRole("button", { name: "Switch to Price" });
  expect(back).toHaveTextContent("Limit ≈ 85.5");
  back.focus();
  await user.keyboard(" ");
  expect(screen.getByRole("textbox", { name: "Limit price" })).toHaveValue(
    "85.5",
  );
  expect(screen.getByText("Default", { exact: true })).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      limitPriceSource: "slippage",
      limitPrice: "",
      slippagePercent: "10",
    }),
  );
});

it.each(["Price", "Slippage"] as const)(
  "resets a manual price to 10% without changing the %s view",
  async (view) => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LimitForm onSubmit={onSubmit} />);
    expect(screen.getByText("Default", { exact: true })).toBeVisible();
    expect(screen.queryByText("Auto", { exact: true })).not.toBeInTheDocument();
    const price = screen.getByRole("textbox", { name: "Limit price" });
    await user.clear(price);
    await user.type(price, "94");
    await user.click(screen.getByRole("button", { name: view }));
    await user.click(screen.getByRole("button", { name: "Reset to default" }));
    expect(screen.getByRole("button", { name: view })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(
      screen.getByRole("textbox", {
        name: view === "Price" ? "Limit price" : "Slippage tolerance (%)",
      }),
    ).toHaveValue(view === "Price" ? "85.5" : "10");
    expect(screen.getByText("Default", { exact: true })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Reset to default" }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
        limitPriceSource: "slippage",
        slippagePercent: "10",
      }),
    );
  },
);

it("shows the tooltip for the selected view", async () => {
  const user = userEvent.setup();
  render(<LimitForm onSubmit={jest.fn()} />);
  const info = screen.getByRole("button", { name: "More information" });
  await user.hover(info);
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    TOOLTIP_DESCRIPTIONS.LIMIT_PRICE_INPUT,
  );
  await user.unhover(info);
  await user.click(screen.getByRole("button", { name: "Slippage" }));
  await user.hover(info);
  expect(await screen.findByRole("tooltip")).toHaveTextContent(
    TOOLTIP_DESCRIPTIONS.LIMIT_SLIPPAGE_INPUT,
  );
});

it("keeps the full manual price when its derived slippage is rounded for display", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(<LimitForm onSubmit={onSubmit} />);
  const price = screen.getByRole("textbox", { name: "Limit price" });
  await user.clear(price);
  await user.type(price, "94.123456789012345678");
  await user.click(screen.getByRole("button", { name: "Slippage" }));
  await user.click(screen.getByRole("button", { name: "Price" }));
  expect(price).toHaveValue("94.123456789012345678");
  expect(
    screen.getByRole("button", { name: "Reset to default" }),
  ).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      limitPriceSource: "price",
      limitPrice: "94.123456789012345678",
      slippagePercent: "10",
    }),
  );
});

it("marks an above-trigger price invalid without a local error before a sell token is selected", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(<LimitForm onSubmit={onSubmit} missingToken="sell" />);
  const price = screen.getByRole("textbox", { name: "Limit price" });
  await user.clear(price);
  await user.type(price, "96");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.queryByText("Limit price must not exceed the trigger price"),
  ).not.toBeInTheDocument();
  expect(price).toHaveAttribute("aria-invalid", "true");
  expect(price).toHaveValue("96");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      strikePrice: "95",
      limitPrice: "96",
      limitPriceSource: "price",
    }),
  );
  expect(onSubmit.mock.calls[0][0].tokenSell).toBeUndefined();
});

it.each([
  ["Price", "0", "Limit price"],
  ["Price", "96", "Limit price"],
  ["Slippage", "100", "Slippage tolerance (%)"],
  ["Slippage", "0.001", "Slippage tolerance (%)"],
] as const)(
  "marks invalid %s input %s without a local error and clears the invalid state after correction",
  async (view, value, name) => {
    const user = userEvent.setup();
    render(<LimitForm onSubmit={jest.fn()} />);
    await user.click(screen.getByRole("button", { name: view }));
    const input = screen.getByRole("textbox", { name });
    await user.clear(input);
    await user.type(input, value);
    expect(input).toHaveValue(value);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "limit-price-hint");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.getElementById("limit-price-error")).toBeNull();
    await user.clear(input);
    await user.type(input, view === "Price" ? "94" : "2");
    expect(input).toHaveAttribute("aria-invalid", "false");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  },
);

it.each(["", ".", "96"])(
  "retains manual price %j across view changes",
  async (value) => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LimitForm onSubmit={onSubmit} />);
    const price = screen.getByRole("textbox", { name: "Limit price" });
    await user.clear(price);
    if (value) await user.type(price, value);
    await user.click(
      screen.getByRole("button", { name: "Switch to Slippage" }),
    );
    await user.click(screen.getByRole("button", { name: "Switch to Price" }));
    expect(price).toHaveValue(value);
    expect(
      screen.getByRole("button", { name: "Reset to default" }),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
        limitPriceSource: "price",
        limitPrice: value,
      }),
    );
  },
);
