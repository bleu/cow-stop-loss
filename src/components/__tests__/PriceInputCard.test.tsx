/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";

import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import { CurrentMarketPrice } from "../CurrentMarketPrice";
import { PriceInputCard } from "../PriceInputCard";
import { Form } from "../ui/form";

jest.mock("@safe-global/safe-apps-react-sdk", () => ({
  useSafeAppsSDK: () => ({
    safe: {
      chainId: 1,
      safeAddress: "0x1111111111111111111111111111111111111111",
    },
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
      <CurrentMarketPrice />
    </Form>
  );
}

it("keeps the exact trigger text in a fixed USDC-per-WETH quote", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
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
  expect(screen.getByText("USDC per WETH")).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /USDC|WETH/ }),
  ).not.toBeInTheDocument();
});

it("sets the trigger to the market quote without a reciprocal conversion", async () => {
  const { sellTokens } = getSupportedTokens(1);
  global.fetch = jest.fn().mockImplementation(async (input) => ({
    json: async () => ({
      price: String(input)
        .toLowerCase()
        .includes(sellTokens[0].token.address.toLowerCase())
        ? 2000
        : 1e12,
    }),
  }));
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  await user.click(
    await screen.findByRole("button", { name: "Set to market" }),
  );

  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
});

it("shows the market quote without a reciprocal-price control", async () => {
  const { sellTokens } = getSupportedTokens(1);
  global.fetch = jest.fn().mockImplementation(async (input) => ({
    json: async () => ({
      price: String(input)
        .toLowerCase()
        .includes(sellTokens[0].token.address.toLowerCase())
        ? 2000
        : 1e12,
    }),
  }));
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  expect(await screen.findByText("1 WETH")).toBeInTheDocument();
  expect(screen.getByText(/2,?000(?:\.0+)? USDC/)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { expanded: false }),
  ).not.toBeInTheDocument();
  expect(screen.queryByText("1 USDC")).not.toBeInTheDocument();
});
