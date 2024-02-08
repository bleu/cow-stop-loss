import { gpV2SettlementAbi } from "@/lib/abis/gpv2Settlement";
import { SignatureVerifierMuxerAbi } from "@/lib/abis/SignatureVerifierMuxer";
import { ChainId, publicClientsFromIds } from "@/lib/publicClients";
import { COMPOSABLE_COW_ADDRESS } from "@/lib/transactionFactory";
import { useSafeAppsSDK } from "@gnosis.pm/safe-apps-react-sdk";
import { SafeInfo } from "@gnosis.pm/safe-apps-sdk";
import { useEffect, useState } from "react";
import { Address } from "viem";

export enum FALLBACK_STATES {
  HAS_DOMAIN_VERIFIER = "HAS_DOMAIN_VERIFIER",
  HAS_EXTENSIBLE_FALLBACK = "HAS_EXTENSIBLE_FALLBACK",
  HAS_NOTHING = "HAS_NOTHING",
}

export const SETTLEMENT_CONTRACT =
  "0x9008D19f58AAbD9eD0D60971565AA8510560ab41" as const;

// Reference: https://github.com/cowprotocol/cowswap/blob/c6614eadc51635a316343d30dffe41fe90cb62a2/apps/cowswap-frontend/src/modules/twap/services/verifyExtensibleFallback.ts#L9
export async function fetchFallbackState({
  safe,
}: {
  safe: SafeInfo;
}): Promise<FALLBACK_STATES> {
  const publicClient = publicClientsFromIds[safe.chainId as ChainId];

  try {
    const domainSeparator = await publicClient.readContract({
      address: SETTLEMENT_CONTRACT,
      abi: gpV2SettlementAbi,
      functionName: "domainSeparator",
    });
    const domainVerifier = await publicClient.readContract({
      address: safe.safeAddress as Address,
      abi: SignatureVerifierMuxerAbi,
      functionName: "domainVerifiers",
      args: [safe.safeAddress as Address, domainSeparator],
    });
    if (
      domainVerifier.toLocaleLowerCase() ===
      COMPOSABLE_COW_ADDRESS.toLocaleLowerCase()
    ) {
      return FALLBACK_STATES.HAS_DOMAIN_VERIFIER;
    }
    return FALLBACK_STATES.HAS_EXTENSIBLE_FALLBACK;
  } catch (error) {
    return FALLBACK_STATES.HAS_NOTHING;
  }
}

export function useFallbackState() {
  const { safe } = useSafeAppsSDK();
  const [fallbackState, setFallbackState] = useState<FALLBACK_STATES>();

  useEffect(() => {
    fetchFallbackState({ safe }).then(setFallbackState);
  }, [safe]);

  return { safe, fallbackState };
}
