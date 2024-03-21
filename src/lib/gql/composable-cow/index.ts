import { gnosis, mainnet, sepolia } from "viem/chains";
import { getSdkWithHooks as ethereumSdk } from "./__generated__/1";
import { getSdkWithHooks as gnosisSdk } from "./__generated__/100";
import { getSdkWithHooks as sepoliaSdk } from "./__generated__/11155111";

export default {
  [mainnet.id]: ethereumSdk,
  [gnosis.id]: gnosisSdk,
  [sepolia.id]: sepoliaSdk,
};
