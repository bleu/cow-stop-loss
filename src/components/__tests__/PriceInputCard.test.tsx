/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";

import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import { PriceInputCard } from "../PriceInputCard";
import { Form } from "../ui/form";

let marketPrice: number | undefined = 2000;
beforeEach(() => {
  marketPrice = 2000;
});

jest.mock("#/hooks/useTokenPairPrice", () => ({
  useTokenPairPrice: () => ({ data: marketPrice }),
}));

jest.mock("wagmi", () => ({
  useAccount: () => ({
    chainId: 1,
    address: "0x1111111111111111111111111111111111111111",
  }),
}));

function PriceForm() {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const form = useForm<SwapData>({
    defaultValues: {
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
      strikePrice: "2000",
    },
  });
  return (
    <Form {...form} onSubmit={() => {}}>
      <PriceInputCard />
    </Form>
  );
}

it("keeps the exact trigger text in a fixed USDC-per-WETH quote", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  const input = screen.getByRole("textbox", { name: "Trigger price" });
  await user.clear(input);
  await user.type(input, "2000.123456789012345678");

  expect(input).toHaveValue("2000.123456789012345678");
  expect(
    await screen.findByRole("button", {
      name: /Set trigger to current market price.*USDC per WETH/,
    }),
  ).toBeInTheDocument();
});

it("sets the trigger to the market quote without a reciprocal conversion", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  await user.click(
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    }),
  );

  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
});

it("shows the market quote without a reciprocal-price control", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  expect(
    await screen.findByText("Market: 2,000 USDC per WETH"),
  ).toBeInTheDocument();
  expect(
    await screen.findByRole("button", {
      name: /Set trigger to current market price.*USDC per WETH/,
    }),
  ).toBeInTheDocument();
  expect(screen.queryByText("1 USDC")).not.toBeInTheDocument();
});

it("places the market-distance hint above the input and aligned with the title", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  const title = screen.getByText("Trigger price");
  const hint = await screen.findByText("At market");
  expect(title.parentElement?.parentElement).toContainElement(hint);
});

it("reserves the market quote row while no oracle price is available", () => {
  marketPrice = undefined;
  const { rerender } = render(<PriceForm />);
  const input = screen.getByRole("textbox", { name: "Trigger price" });
  const quoteRow = input.nextElementSibling;
  expect(quoteRow).toHaveClass("h-5");
  expect(quoteRow).toBeEmptyDOMElement();
  expect(screen.queryByText(/loading|unavailable/i)).not.toBeInTheDocument();
  marketPrice = 2000;
  rerender(<PriceForm />);
  expect(input.nextElementSibling).toBe(quoteRow);
  expect(quoteRow).toContainElement(
    screen.getByRole("button", { name: /Set trigger to current market price/ }),
  );
});
