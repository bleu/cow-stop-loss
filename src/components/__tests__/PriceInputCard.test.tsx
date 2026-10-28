/** @jest-environment jsdom */

// Opt in to simulated TEST approvals; production policy remains unchanged.
jest.mock("#/lib/supportedTokens", () => {
  const actual = jest.requireActual("#/lib/supportedTokens");
  const { TEST_SUPPORTED_TOKENS } = jest.requireActual("#/test/approvedRoutes");
  return {
    ...actual,
    getSupportedTokens: (chainId: import("#/lib/publicClients").ChainId) =>
      TEST_SUPPORTED_TOKENS[chainId] ?? actual.getSupportedTokens(chainId),
  };
});

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { SWRConfig, useSWRConfig } from "swr";
import { parseUnits } from "viem";

import { publicClientsFromIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import { PriceInputCard } from "../PriceInputCard";
import { Form } from "../ui/form";

let marketPrice: number | undefined = 2000;
beforeEach(() => {
  marketPrice = 2000;
  jest.spyOn(publicClientsFromIds[1], "getBlock").mockResolvedValue({
    number: BigInt(1),
    timestamp: BigInt(1),
  } as Awaited<ReturnType<(typeof publicClientsFromIds)[1]["getBlock"]>>);
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "decimals") return 18;
      if (marketPrice === undefined) throw new Error("Oracle unavailable");
      const price =
        address?.toLowerCase() === "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
          ? marketPrice
          : 1;
      return [
        BigInt(1),
        parseUnits(price.toFixed(18), 18),
        BigInt(1),
        BigInt(1),
        BigInt(1),
      ];
    });
});
afterEach(() => jest.restoreAllMocks());

jest.mock("wagmi", () => ({
  useAccount: () => ({
    chainId: 1,
    address: "0x1111111111111111111111111111111111111111",
  }),
}));

function PriceForm({
  onSubmit = () => {},
  disabled = false,
}: {
  onSubmit?: (data: SwapData) => void;
  disabled?: boolean;
}) {
  const { mutate } = useSWRConfig();
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const form = useForm<SwapData>({
    defaultValues: {
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
      strikePrice: "2000",
    },
  });
  return (
    <Form {...form} onSubmit={onSubmit}>
      <PriceInputCard disabled={disabled} />
      <button type="submit">Submit</button>
      <button
        type="button"
        onClick={() => void mutate(() => true, undefined, { revalidate: true })}
      >
        Refresh market
      </button>
    </Form>
  );
}

it("submits a fixed trigger price from a percentage drop", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({ strikePrice: "1800" }),
    ),
  );
  expect(screen.getByLabelText("Trigger price")).toBe(input);
  const hint = screen.getByText("Trigger: $1,800");
  const market = screen.getByRole("button", {
    name: /Set trigger to current market price/,
  });
  expect(market.parentElement).toContainElement(hint);
  expect(screen.queryByText(/below market/)).not.toBeInTheDocument();
  expect(screen.queryByText(/when entered/)).not.toBeInTheDocument();
  expect(
    screen.queryByText(/does not follow the market/),
  ).not.toBeInTheDocument();
});

it("switches input modes without rounding the stored trigger price", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  const price = screen.getByRole("textbox", { name: "Trigger price" });
  await user.clear(price);
  await user.type(price, "1800.123456789012345678");
  await user.click(screen.getByRole("button", { name: "% drop" }));
  expect(screen.getByRole("textbox", { name: "Price drop (%)" })).toHaveValue(
    "9.99382716",
  );
  await user.click(screen.getByRole("button", { name: "Price" }));
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "1800.123456789012345678",
  );
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe(
      "1800.123456789012345678",
    ),
  );
});

it("submits small percentage-derived prices without exponent notation", async () => {
  marketPrice = 0.00000001;
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe("0.000000009"),
  );
});

it.each(["", ".", "100", "101"])(
  "clears the stored price for invalid percentage %j",
  async (value) => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PriceForm onSubmit={onSubmit} />
      </SWRConfig>,
    );
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    });
    await user.click(screen.getByRole("button", { name: "% drop" }));
    const input = screen.getByRole("textbox", { name: "Price drop (%)" });
    await user.clear(input);
    await user.type(input, "10");
    await user.clear(input);
    if (value) await user.type(input, value);
    await user.click(screen.getByRole("button", { name: "Submit" }));
    await waitFor(() =>
      expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe(""),
    );
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Enter a drop from 0% to less than 100%.",
    );
  },
);

it("rejects non-decimal percentage edits without changing the stored price", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10.5");
  await user.type(input, "abcEe+-., ");
  expect(input).toHaveValue("10.5");
  for (const value of ["-1", "1e1", "Infinity", "NaN", "1.2.3", " "]) {
    await user.paste(value);
    expect(input).toHaveValue("10.5");
  }
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe("1790"),
  );
  expect(input).toHaveAttribute("aria-invalid", "false");
});

it("keeps the trigger fixed when the market changes and uses the latest quote on a new edit", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10");
  marketPrice = 2200;
  await user.click(screen.getByRole("button", { name: "Refresh market" }));
  await screen.findByRole("button", {
    name: "Set trigger to current market price 2,200 USDC per WETH",
  });
  expect(input).toHaveValue("10");
  expect(screen.getByText("Trigger: $1,800")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe("1800"),
  );
  await user.clear(input);
  await user.type(input, "10");
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[1]?.[0].strikePrice).toBe("1980"),
  );
  expect(screen.getByText("Trigger: $1,980")).toBeInTheDocument();
});

it("returns to price entry when the market-price shortcut is selected", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );
  const market = await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "100");
  await user.click(market);
  expect(screen.getByRole("button", { name: "Price" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps percentage entry disabled until a market quote is available", async () => {
  marketPrice = undefined;
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <PriceForm />
    </SWRConfig>,
  );
  const percentMode = screen.getByRole("button", {
    name: "% drop",
  });
  expect(percentMode).toBeDisabled();
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toBeEnabled();
  marketPrice = 2000;
  await user.click(screen.getByRole("button", { name: "Refresh market" }));
  await waitFor(() => expect(percentMode).toBeEnabled());
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "2000",
  );
});

it("disables all trigger controls while the card is disabled", async () => {
  const user = userEvent.setup();
  const { rerender } = render(<PriceForm />, {
    wrapper: ({ children }) => (
      <SWRConfig value={{ provider: () => new Map() }}>{children}</SWRConfig>
    ),
  });
  const market = await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  rerender(<PriceForm disabled />);
  expect(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
  ).toBeDisabled();
  expect(screen.getByRole("button", { name: "Price" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "% drop" })).toBeDisabled();
  expect(market).toBeDisabled();
});

it("does not change percentage intent when the selected mode is clicked again", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  const percentMode = screen.getByRole("button", {
    name: "% drop",
  });
  await user.click(percentMode);
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10");
  marketPrice = 2200;
  await user.click(screen.getByRole("button", { name: "Refresh market" }));
  await screen.findByRole("button", {
    name: "Set trigger to current market price 2,200 USDC per WETH",
  });
  await user.click(percentMode);
  expect(input).toHaveValue("10");
  expect(screen.getByText("Trigger: $1,800")).toBeInTheDocument();
});

it("clears percentage errors after correcting the trigger in price mode", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  await user.type(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
    "100",
  );
  await user.click(screen.getByRole("button", { name: "Price" }));
  await user.type(
    screen.getByRole("textbox", { name: "Trigger price" }),
    "1800",
  );
  await user.click(screen.getByRole("button", { name: "% drop" }));
  expect(screen.getByRole("textbox", { name: "Price drop (%)" })).toHaveValue(
    "10",
  );
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(
    screen.getByRole("textbox", { name: "Price drop (%)" }),
  ).toHaveAttribute("aria-invalid", "false");
});

it.each([
  ["0", "2000"],
  [".5", "1990"],
  ["12.5", "1750"],
])("submits percentage %s as price %s", async (value, expected) => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, value);
  await user.click(screen.getByRole("button", { name: "Submit" }));
  await waitFor(() =>
    expect(onSubmit.mock.calls[0]?.[0].strikePrice).toBe(expected),
  );
  expect(input).toHaveAttribute("aria-invalid", "false");
});

it("explains why percentage entry stops when the market quote is lost", async () => {
  const user = userEvent.setup();
  const onSubmit = jest.fn();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm onSubmit={onSubmit} />
    </SWRConfig>,
  );
  await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  await user.click(screen.getByRole("button", { name: "% drop" }));
  const input = screen.getByRole("textbox", { name: "Price drop (%)" });
  await user.clear(input);
  await user.type(input, "10");
  marketPrice = undefined;
  await user.click(screen.getByRole("button", { name: "Refresh market" }));
  await waitFor(() => expect(input).toBeDisabled());
  expect(
    screen.getByText(
      "Percentage entry needs a current market price. Use Price to continue.",
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Price" }));
  expect(screen.getByRole("textbox", { name: "Trigger price" })).toHaveValue(
    "1800",
  );
});

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

it.each([
  [2000, "2000"],
  [2000.123456789, "2000.1235"],
])(
  "sets the trigger from market %s without a reciprocal conversion",
  async (price, expected) => {
    marketPrice = price;
    const user = userEvent.setup();
    render(
      <SWRConfig value={{ provider: () => new Map() }}>
        <PriceForm />
      </SWRConfig>,
    );

    const input = screen.getByRole("textbox", { name: "Trigger price" });
    await user.clear(input);
    await user.type(input, "1500");
    await user.click(
      await screen.findByRole("button", {
        name: /Set trigger to current market price/,
      }),
    );

    expect(input).toHaveValue(expected);
  },
);

it("shows a dollar market quote and keeps the full pair in its accessible label", async () => {
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  const market = await screen.findByRole("button", {
    name: "Set trigger to current market price 2,000 USDC per WETH",
  });
  expect(market).toHaveTextContent(/^Market: \$2,000$/);
  expect(screen.queryByText("1 USDC")).not.toBeInTheDocument();
});

it("places the market-distance hint beside Market and replaces it with the trigger price in percentage mode", async () => {
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <PriceForm />
    </SWRConfig>,
  );

  const market = await screen.findByRole("button", {
    name: /Set trigger to current market price/,
  });
  const hint = await screen.findByText("At market");
  expect(market.parentElement).toContainElement(hint);
  await user.click(screen.getByRole("button", { name: "% drop" }));
  expect(screen.queryByText("At market")).not.toBeInTheDocument();
  expect(market.parentElement).toContainElement(
    screen.getByText("Trigger: $2,000"),
  );
  await user.click(screen.getByRole("button", { name: "Price" }));
  expect(screen.queryByText(/Trigger:/)).not.toBeInTheDocument();
  expect(market.parentElement).toContainElement(screen.getByText("At market"));
});

it("reserves the market quote row while no oracle price is available", async () => {
  marketPrice = undefined;
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map(), revalidateOnFocus: false }}>
      <PriceForm />
    </SWRConfig>,
  );
  const input = screen.getByRole("textbox", { name: "Trigger price" });
  const quoteRow = input.parentElement?.lastElementChild;
  expect(quoteRow).toHaveClass("h-5");
  expect(quoteRow).toBeEmptyDOMElement();
  expect(screen.queryByText(/loading|unavailable/i)).not.toBeInTheDocument();
  marketPrice = 2000;
  await user.click(screen.getByRole("button", { name: "Refresh market" }));
  expect(input.parentElement?.lastElementChild).toBe(quoteRow);
  expect(quoteRow).toContainElement(
    await screen.findByRole("button", {
      name: /Set trigger to current market price/,
    }),
  );
});
