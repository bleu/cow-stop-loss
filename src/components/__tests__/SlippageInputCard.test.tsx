/** @jest-environment jsdom */

import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { slippagePercentSchema } from "#/lib/calculateAmounts";
import type { SwapData } from "#/lib/types";

import { SlippageInputCard } from "../SlippageInputCard";
import { Form } from "../ui/form";

function SlippageForm() {
  const form = useForm<SwapData>({
    resolver: zodResolver(z.object({ slippagePercent: slippagePercentSchema })),
    mode: "onChange",
    defaultValues: { slippagePercent: "0.1" },
  });
  return (
    <Form {...form} onSubmit={() => {}}>
      <SlippageInputCard />
    </Form>
  );
}

it("shows the default slippage in an always-visible custom input", () => {
  render(<SlippageForm />);

  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.1");
});

it("fills the custom input when a slippage preset is selected", async () => {
  const user = userEvent.setup();
  render(<SlippageForm />);

  await user.click(screen.getByRole("radio", { name: "0.5%" }));

  expect(screen.getByRole("textbox", { name: "Slippage" })).toHaveValue("0.5");
  expect(screen.getByRole("radio", { name: "0.5%" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});

it("selects the matching preset for custom values and clears it for other values", async () => {
  const user = userEvent.setup();
  render(<SlippageForm />);
  const input = screen.getByRole("textbox", { name: "Slippage" });

  await user.clear(input);
  await user.type(input, "0.50");
  expect(screen.getByRole("radio", { name: "0.5%" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await user.clear(input);
  await user.type(input, "0.25");
  for (const preset of screen.getAllByRole("radio")) {
    expect(preset).toHaveAttribute("aria-checked", "false");
  }
  expect(input).toHaveValue("0.25");
});

it("shows an error for extra decimal places without changing the input", async () => {
  const user = userEvent.setup();
  render(<SlippageForm />);
  const input = screen.getByRole("textbox", { name: "Slippage" });

  await user.clear(input);
  await user.type(input, "0.001");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "Slippage must be between 0% and 99.99% with at most two decimal places",
  );
  expect(input).toHaveValue("0.001");
});
