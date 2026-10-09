import { createConfig, http } from "wagmi";
import { arbitrum, gnosis, mainnet, sepolia } from "wagmi/chains";
import { injected, walletConnect } from "wagmi/connectors";

export function createWagmiConfig() {
  const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window === "undefined"
      ? "http://localhost:3000"
      : window.location.origin);
  return createConfig({
    ssr: true,
    chains: [mainnet, sepolia, gnosis, arbitrum],
    connectors: [
      injected(),
      ...(projectId
        ? [
            walletConnect({
              projectId,
              metadata: {
                name: "CoW Stop Loss",
                description:
                  "View your stop-loss orders across supported chains.",
                url: appUrl,
                icons: [`${appUrl}/assets/stoploss.svg`],
              },
            }),
          ]
        : []),
    ],
    transports: {
      [mainnet.id]: http(),
      [sepolia.id]: http(),
      [gnosis.id]: http(),
      [arbitrum.id]: http(),
    },
  });
}

export const wagmiConfig = createWagmiConfig();
