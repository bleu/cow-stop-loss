import {
  cookieStorage,
  cookieToInitialState,
  createConfig,
  createStorage,
  http,
} from "wagmi";
import { arbitrum, gnosis, mainnet, sepolia } from "wagmi/chains";

const config = createConfig({
  ssr: true,
  storage: createStorage({ storage: cookieStorage }),
  chains: [
    mainnet,
    { ...sepolia, name: "Sepolia (testnet)" },
    gnosis,
    { ...arbitrum, name: "Arbitrum" },
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [gnosis.id]: http(),
    [arbitrum.id]: http(),
  },
});

export function getWagmiInitialState(cookie: string | null) {
  return cookieToInitialState(config, cookie);
}
