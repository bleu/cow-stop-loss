import { useSafeAppsSDK } from "@safe-global/safe-apps-react-sdk";
import { Address } from "viem";

import { ChainId } from "#/lib/publicClients";

export function useSafeApp() {
  const { safe, sdk } = useSafeAppsSDK();
  return {
    safeAddress: safe.safeAddress as Address,
    chainId: safe.chainId as ChainId,
    sdk,
  };
}
