import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  injectedWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { cookieStorage, createConfig, createStorage } from "wagmi";

import { createRpcTransports, supportedChains } from "#/lib/publicClients";

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
          appName: "CoW Air Rescue",
          projectId,
          walletConnectParameters: {
            metadata: {
              name: "CoW Air Rescue",
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
    storage: createStorage({ storage: cookieStorage }),
    chains: supportedChains,
    connectors,
    transports: createRpcTransports(),
  });
}

export const wagmiConfig = createWagmiConfig();
