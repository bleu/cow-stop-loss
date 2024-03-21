import { gnosis, mainnet, sepolia } from "viem/chains";
import { getSdk as ethereumSdk } from "./__generated__/1.server";
import { getSdk as gnosisSdk } from "./__generated__/100.server";
import { getSdk as sepoliaSdk } from "./__generated__/11155111.server";

export default {
  [mainnet.id]: ethereumSdk,
  [gnosis.id]: gnosisSdk,
  [sepolia.id]: sepoliaSdk,
};
