import { createConfig, http } from "wagmi";
import { arbitrum, gnosis, mainnet, sepolia } from "wagmi/chains";
import { safe } from "wagmi/connectors";

export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, gnosis, arbitrum],
  connectors: [safe()],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [gnosis.id]: http(),
    [arbitrum.id]: http(),
  },
});
