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

it("accepts a custom slippage without preset controls", async () => {
  const user = userEvent.setup();
  render(<SlippageForm />);
  const input = screen.getByRole("textbox", { name: "Slippage" });
  await user.clear(input);
  await user.type(input, "0.25");
  expect(input).toHaveValue("0.25");
  expect(screen.queryByRole("radio")).not.toBeInTheDocument();
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
