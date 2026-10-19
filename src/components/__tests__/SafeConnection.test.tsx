/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */
import { render, screen } from "@testing-library/react";
import React from "react";
import { useAccount, WagmiProvider } from "wagmi";

import { createWagmiConfig } from "#/utils/wagmi";

function Account() {
  const { address } = useAccount();
  return (
    <output aria-label="Connected account">{address ?? "Disconnected"}</output>
  );
}

test("connects the Safe iframe without blocking the page", async () => {
  const original = Object.getOwnPropertyDescriptor(window, "parent");
  const parent = {
    postMessage: (message: { id: string; method: string }) => {
      if (message.method !== "getSafeInfo") return;
      setTimeout(
        () =>
          window.dispatchEvent(
            new MessageEvent("message", {
              source: parent as unknown as Window,
              origin: "https://app.safe.global",
              data: {
                id: message.id,
                version: "1.0.0",
                success: true,
                data: {
                  safeAddress: "0x1111111111111111111111111111111111111111",
                  chainId: 1,
                  owners: [],
                  threshold: 2,
                },
              },
            }),
          ),
        0,
      );
    },
  };
  Object.defineProperty(window, "parent", {
    configurable: true,
    value: parent,
  });
  try {
    render(
      <WagmiProvider config={createWagmiConfig()}>
        <Account />
      </WagmiProvider>,
    );
    expect(
      await screen.findByText("0x1111111111111111111111111111111111111111"),
    ).toBeInTheDocument();
  } finally {
    if (original) Object.defineProperty(window, "parent", original);
  }
});
