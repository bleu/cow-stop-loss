/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";

import type { SwapData } from "#/lib/types";

import { Form } from "../ui/form";

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({
    chainId: 1,
    address: "0x3ebC89534d84Ca51987Af62EBCc7B356BFd65728",
    isConnected: true,
  }),
}));

const originalRpcUrl = process.env.NEXT_PUBLIC_RPC_URL_MAINNET;
const originalRequest = globalThis.Request;
process.env.NEXT_PUBLIC_RPC_URL_MAINNET = "http://127.0.0.1:8545";
const { TokenInputCard } =
  jest.requireActual<typeof import("../TokenInputCard")>("../TokenInputCard");
const { getSupportedTokens } = jest.requireActual<
  typeof import("#/lib/supportedTokens")
>("#/lib/supportedTokens");

afterAll(() => {
  if (originalRpcUrl === undefined)
    delete process.env.NEXT_PUBLIC_RPC_URL_MAINNET;
  else process.env.NEXT_PUBLIC_RPC_URL_MAINNET = originalRpcUrl;
  globalThis.Request = originalRequest;
});

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

it("keeps a failed configured RPC isolated from public mainnet endpoints", async () => {
  globalThis.Request ??= jest.fn() as unknown as typeof Request;
  const fetchRpc = jest.fn(async (_url: unknown, init?: RequestInit) => {
    const request = init?.body ? JSON.parse(String(init.body)) : undefined;
    return {
      ok: true,
      headers: { get: () => "application/json" },
      json: async () =>
        request
          ? {
              jsonrpc: "2.0",
              id: request.id,
              error: { code: -32603, message: "Configured RPC unavailable" },
            }
          : { price: 1 },
    } as unknown as Response;
  });
  global.fetch = fetchRpc;
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  expect(await screen.findByText("Balance unavailable")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
  const rpcUrls = fetchRpc.mock.calls
    .filter(([, init]) => init?.body)
    .map(([url]) => url);
  expect(rpcUrls.length).toBeGreaterThan(0);
  expect(new Set(rpcUrls)).toEqual(new Set(["http://127.0.0.1:8545"]));
});
