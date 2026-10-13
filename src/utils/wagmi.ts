import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { createConfig } from "wagmi";
import { arbitrum, gnosis, mainnet, sepolia } from "wagmi/chains";

import { createRpcTransport } from "#/lib/publicClients";

export function createWagmiConfig() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin);
  const browserWallet = () => ({ ...injectedWallet(), name: "Browser wallet" });
  const {
    createConnector,
    hidden: _hidden,
    ...browserDetails
  } = browserWallet();
  const connectors = projectId
    ? connectorsForWallets(
        [
          {
            groupName: "Wallets",
            wallets: [browserWallet, walletConnectWallet],
          },
        ],
        {
          appName: "CoW Stop Loss",
          projectId,
          walletConnectParameters: {
            metadata: {
              name: "CoW Stop Loss",
              description:
                "View your stop-loss orders across supported chains.",
              url: appUrl,
              icons: [`${appUrl}/assets/stoploss.svg`],
            },
          },
        },
      )
    : [
        createConnector({
          rkDetails: {
            ...browserDetails,
            index: 0,
            groupIndex: 0,
            groupName: "Wallets",
            isRainbowKitConnector: true,
          },
        }),
      ];

  return createConfig({
    ssr: true,
    chains: [
      mainnet,
      { ...sepolia, name: "Sepolia (testnet)" },
      gnosis,
      { ...arbitrum, name: "Arbitrum" },
    ],
    connectors,
    transports: {
      [mainnet.id]: createRpcTransport(mainnet),
      [sepolia.id]: createRpcTransport(sepolia),
      [gnosis.id]: createRpcTransport(gnosis),
      [arbitrum.id]: createRpcTransport(arbitrum),
    },
  });
}

export const wagmiConfig = createWagmiConfig();
