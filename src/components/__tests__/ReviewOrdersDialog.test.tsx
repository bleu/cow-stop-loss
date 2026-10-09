/**
 * @jest-environment jsdom
 * @jest-environment-options {"customExportConditions": ["node", "node-addons"]}
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { SWRConfig } from "swr";
import { WagmiProvider } from "wagmi";

import {
  defaultAdvancedSettings,
  useAdvancedSettingsStore,
} from "#/hooks/useAdvancedSettings";
import { useDraftOrder } from "#/hooks/useDraftOrder";
import { COMPOSABLE_COW_ADDRESS } from "#/lib/contracts";
import { publicClientsFromIds } from "#/lib/publicClients";
import { VALID_TO_OPTIONS } from "#/lib/schema";
import { getSupportedTokens } from "#/lib/supportedTokens";
import { createWagmiConfig } from "#/utils/wagmi";

import { ReviewOrdersDialog } from "../ReviewOrdersDialog";

const safe = {
  chainId: 1,
  safeAddress: "0x1111111111111111111111111111111111111111" as const,
};
jest.mock("@safe-global/safe-apps-react-sdk", () => ({
  useSafeAppsSDK: () => ({ safe, sdk: {} }),
}));
jest.mock("@safe-global/safe-gateway-typescript-sdk", () => ({
  getTransactionQueue: jest.fn().mockResolvedValue({ results: [] }),
}));

afterEach(() => jest.restoreAllMocks());

it("reviews slippage and exact amounts without a limit price row", async () => {
  const { sellTokens, buyToken } = getSupportedTokens(1);
  useAdvancedSettingsStore
    .getState()
    .setAdvancedSettings(defaultAdvancedSettings);
  global.fetch = jest.fn().mockImplementation(async (input) => ({
    json: async () => ({
      price: String(input)
        .toLowerCase()
        .includes(sellTokens[0].token.address.toLowerCase())
        ? 2000
        : 1e12,
    }),
  }));
  jest
    .spyOn(publicClientsFromIds[1], "readContract")
    .mockImplementation(async ({ functionName, address }) => {
      if (functionName === "domainSeparator") return `0x${"1".repeat(64)}`;
      if (functionName === "domainVerifiers") return COMPOSABLE_COW_ADDRESS;
      if (functionName === "decimals") return 8;
      return [
        BigInt(1),
        address?.toLowerCase() === "0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419"
          ? BigInt("200000000000")
          : BigInt("100000000"),
        BigInt(1),
        BigInt(1),
        BigInt(1),
      ];
    });
  const draft = await useDraftOrder.getState().createDraftOrder(
    {
      tokenSell: sellTokens[0].token,
      tokenBuy: buyToken.token,
      amountSell: "0.123456789012345678",
      amountBuy: "",
      strikePrice: "2000",
      slippagePercent: "0.1",
      isSellOrder: true,
      validTo: VALID_TO_OPTIONS.DAY,
    },
    1,
    safe.safeAddress,
  );
  const config = createWagmiConfig();
  const queryClient = new QueryClient();
  render(
    <SWRConfig value={{ provider: () => new Map() }}>
      <ReviewOrdersDialog draftOrders={[draft]} open setOpen={() => {}} />
    </SWRConfig>,
    {
      wrapper: ({ children }) => (
        <WagmiProvider config={config} reconnectOnMount={false}>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      ),
    },
  );

  expect(await screen.findByText("Slippage")).toBeInTheDocument();
  expect(screen.getByText("0.1%")).toBeInTheDocument();
  expect(screen.getByText("0.123456789012345678 WETH")).toBeInTheDocument();
  expect(screen.getByText("246.666665 USDC")).toBeInTheDocument();
  expect(screen.queryByText("Limit price")).not.toBeInTheDocument();
  expect(screen.getByText("Trigger price")).toBeInTheDocument();
  expect(screen.getByText("Receiver")).toBeInTheDocument();
  expect(screen.getByText("Expiration date")).toBeInTheDocument();
});
