import {
  cookieStorage,
  cookieToInitialState,
  createConfig,
  createStorage,
} from "wagmi";

import { createWalletRpcTransports, walletChains } from "#/lib/publicClients";

export const wagmiServerConfig = createConfig({
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  chains: walletChains,
  transports: createWalletRpcTransports(),
});

export function getWagmiInitialState(cookie: string | null) {
  return cookieToInitialState(wagmiServerConfig, cookie);
}
