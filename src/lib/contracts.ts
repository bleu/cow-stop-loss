import { gnosis, mainnet, sepolia } from "viem/chains";

// These addresses are the same for all supported chains (mainnet and goerli)
export const COMPOSABLE_COW_ADDRESS =
  "0xfdaFc9d1902f4e0b84f65F49f244b32b31013b74" as const;
export const STOP_LOSS_ADDRESS =
  "0xE8212F30C28B4AAB467DF3725C14d6e89C2eB967" as const;
export const SETTLEMENT_CONTRACT_ADDRESS =
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41" as const;
export const EXTENSIBLE_FALLBACK_ADDRESS =
  "0x2f55e8b20D0B9FEFA187AA7d00B6Cbe563605bF5" as const;
export const TRAMPOLINE_ADDRESS =
  "0x01DcB88678aedD0C4cC9552B20F4718550250574" as const;
export const GPV2_VAULT_RELAYER_ADDRESS =
  "0xC92E8bdf79f0507f65a392b0ab4667716BFE0110" as const;

export const PRICE_FEED_REGISTER_ADDRESS = {
  [mainnet.id]: "0x47Fb2585D2C56Fe188D0E6ec628a38b74fCeeeDf",
} as const;

export const BALANCER_MINTER_ADDRESS = {
  [mainnet.id]: "0x239e55F427D44C3cc793f49bFB507ebe76638a2b",
  [gnosis.id]: "0xA8920455934Da4D853faac1f94Fe7bEf72943eF1",
  [sepolia.id]: "0x1783Cd84b3d01854A96B4eD5843753C2CcbD574A",
} as const;
