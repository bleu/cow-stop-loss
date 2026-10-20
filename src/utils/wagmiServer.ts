import {
  cookieStorage,
  cookieToInitialState,
  createConfig,
  createStorage,
} from "wagmi";

import { createRpcTransports, supportedChains } from "#/lib/publicClients";

export const wagmiServerConfig = createConfig({
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  chains: supportedChains,
  transports: createRpcTransports(),
});

export function getWagmiInitialState(cookie: string | null) {
  return cookieToInitialState(wagmiServerConfig, cookie);
}
