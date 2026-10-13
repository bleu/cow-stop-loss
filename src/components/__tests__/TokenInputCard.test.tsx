/** @jest-environment jsdom */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useForm } from "react-hook-form";
import { SWRConfig } from "swr";

import { ChainId, publicClientsFromIds } from "#/lib/publicClients";
import { getSupportedTokens } from "#/lib/supportedTokens";
import type { SwapData } from "#/lib/types";

import { TokenInputCard } from "../TokenInputCard";
import { Form } from "../ui/form";

const mockAccount = {
  chainId: 1,
  address: "0x3ebC89534d84Ca51987Af62EBCc7B356BFd65728",
  isConnected: true,
};
const originalRequest = globalThis.Request;

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => mockAccount,
}));

function TokenForm() {
  const { sellTokens, buyToken } = getSupportedTokens(
    mockAccount.chainId as ChainId,
  );
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

afterEach(() => {
  jest.restoreAllMocks();
  globalThis.Request = originalRequest;
  mockAccount.chainId = 1;
  mockAccount.address = "0x3ebC89534d84Ca51987Af62EBCc7B356BFd65728";
});

it("shows a pending balance read as loading instead of zero", () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockReturnValue(new Promise(() => {}));
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  expect(screen.getByText("Balance: Loading...")).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
});

it("retries an unavailable balance without displaying zero", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockRejectedValueOnce(new Error("RPC unavailable"))
    .mockResolvedValue(BigInt("727418369421963174"));
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  expect(await screen.findByText("Balance unavailable")).toBeInTheDocument();
  expect(screen.queryByText("Balance: 0")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Retry WETH balance" }));
  await user.click(await screen.findByRole("button", { name: "Max" }));

  expect(read).toHaveBeenCalledTimes(2);
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue(
    "0.727418369421963174",
  );
});

it("reads mainnet WETH through the working default RPC for the connected wallet", async () => {
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
              result:
                "0x0000000000000000000000000000000000000000000000000a184f27287d6fa6",
            }
          : { price: 1 },
    } as unknown as Response;
  });
  global.fetch = fetchRpc;
  const user = userEvent.setup();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  await user.click(await screen.findByRole("button", { name: "Max" }));
  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue(
    "0.727418369421963174",
  );
  expect(fetchRpc).toHaveBeenCalledWith(
    "https://ethereum-rpc.publicnode.com",
    expect.objectContaining({ method: "POST" }),
  );
  const rpcCall = fetchRpc.mock.calls.find(
    ([url]) => url === "https://ethereum-rpc.publicnode.com",
  );
  const request = JSON.parse(String(rpcCall?.[1]?.body));
  expect(request.method).toBe("eth_call");
  expect(request.params[0].to.toLowerCase()).toBe(
    "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
  );
  expect(request.params[0].data).toBe(
    "0x70a082310000000000000000000000003ebc89534d84ca51987af62ebcc7b356bfd65728",
  );
  expect(request.params[1]).toBe("latest");
});

it("ignores a late balance from the previous wallet", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  let resolveOldBalance!: (balance: bigint) => void;
  const read = jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockReturnValueOnce(
      new Promise<bigint>((resolve) => {
        resolveOldBalance = resolve;
      }),
    )
    .mockResolvedValue(BigInt("2000000000000000000"));
  const user = userEvent.setup();
  const view = render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );
  mockAccount.address = "0x2222222222222222222222222222222222222222";
  view.rerender(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  await screen.findByRole("button", { name: "Max" });
  await act(async () => resolveOldBalance(BigInt("9000000000000000000")));
  await user.click(screen.getByRole("button", { name: "Max" }));

  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("2");
  expect(read).toHaveBeenLastCalledWith(
    expect.objectContaining({
      args: ["0x2222222222222222222222222222222222222222"],
    }),
  );
});

it("shows zero only after a successful balance read", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockResolvedValue(BigInt(0));
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm />
    </SWRConfig>,
  );

  expect(await screen.findByText("Balance: 0")).toBeInTheDocument();
  expect(screen.queryByText("Balance: Loading...")).not.toBeInTheDocument();
  expect(screen.queryByText("Balance unavailable")).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Max" })).not.toBeInTheDocument();
});

it("reads the selected chain and ignores a stale mainnet balance", async () => {
  global.fetch = jest
    .fn()
    .mockResolvedValue({ json: async () => ({ price: 1 }) });
  let resolveOldBalance!: (balance: bigint) => void;
  jest.spyOn(publicClientsFromIds[1], "readContract").mockReturnValueOnce(
    new Promise<bigint>((resolve) => {
      resolveOldBalance = resolve;
    }),
  );
  const gnosisRead = jest
    .spyOn(publicClientsFromIds[100], "readContract")
    .mockResolvedValue(BigInt("3000000000000000000"));
  const user = userEvent.setup();
  const view = render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm key="mainnet" />
    </SWRConfig>,
  );
  mockAccount.chainId = 100;
  view.rerender(
    <SWRConfig value={{ provider: () => new Map() }}>
      <TokenForm key="gnosis" />
    </SWRConfig>,
  );

  await screen.findByRole("button", { name: "Max" });
  await act(async () => resolveOldBalance(BigInt("9000000000000000000")));
  await user.click(screen.getByRole("button", { name: "Max" }));

  expect(screen.getByRole("textbox", { name: "Sell amount" })).toHaveValue("3");
  expect(gnosisRead).toHaveBeenCalledWith(
    expect.objectContaining({
      address: getSupportedTokens(100).sellTokens[0].token.address,
      args: ["0x3ebC89534d84Ca51987Af62EBCc7B356BFd65728"],
    }),
  );
});

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
