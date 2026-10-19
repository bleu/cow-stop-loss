/** @jest-environment jsdom */

import { RainbowKitProvider, useChainModal } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createPublicClient, custom } from "viem";
import { createConfig, WagmiProvider } from "wagmi";

import { CHAIN_INFO } from "#/lib/chainInfo";
import { supportedChains } from "#/lib/publicClients";

jest.mock("wagmi", () => ({
  ...jest.requireActual("wagmi"),
  useAccount: () => ({ chainId: 1, status: "connected", isConnected: true }),
}));

function OpenNetworkMenu() {
  const { openChainModal } = useChainModal();
  return <button onClick={openChainModal}>Networks</button>;
}

it("shows local Linea and Plasma icons in the RainbowKit network menu", async () => {
  const request = jest
    .fn()
    .mockRejectedValue(new Error("Unexpected RPC request"));
  const config = createConfig({
    chains: supportedChains,
    client: ({ chain }) =>
      createPublicClient({
        chain,
        transport: custom({ request }),
      }),
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const view = render(
    <WagmiProvider config={config} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider locale="en-US">
          <OpenNetworkMenu />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>,
  );

  fireEvent.click(screen.getByRole("button", { name: "Networks" }));
  const menu = await screen.findByRole("dialog");
  for (const id of [59144, 9745] as const) {
    const chain = CHAIN_INFO[id];
    const image = await within(menu).findByRole("img", { name: chain.label });
    expect(image.querySelector("img")).toHaveAttribute("src", chain.icon);
    expect(image).toHaveStyle({ background: chain.color });
  }

  expect(request).not.toHaveBeenCalled();
  view.unmount();
  queryClient.clear();
});
