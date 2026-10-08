/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";

import { publicClientsFromIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import { TokenInputCard } from "../TokenInputCard";
import { Form } from "../ui/form";

jest.mock("@safe-global/safe-apps-react-sdk", () => ({
  useSafeAppsSDK: () => ({
    safe: {
      chainId: 1,
      safeAddress: "0x1111111111111111111111111111111111111111",
    },
  }),
}));

function TokenForm() {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  const form = useForm<SwapData>({
    defaultValues: {
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
      amountSell: "",
      isSellOrder: true,
    },
  });
  return (
    <Form {...form} onSubmit={() => {}}>
      <TokenInputCard side="Sell" />
    </Form>
  );
}

afterEach(() => jest.restoreAllMocks());

it("uses the full token balance for Max without number conversion", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValue(BigInt("1123456789012345678"));
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  await user.click(await screen.findByRole("button", { name: "Max" }));

  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue(
    "1.123456789012345678",
  );
});
