import type { Address } from "viem";
import { useAccount } from "wagmi";

import { configuredTokenOracle } from "#/lib/oraclePrice";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useOraclePrice } from "./useOraclePrice";

export function useTokenPrice(
  token?: IToken,
  tokenChainId?: ChainId,
  savedOracle?: Address,
  maxAge?: number,
) {
  const { chainId: accountChainId } = useAccount();
  const chainId = tokenChainId ?? ((accountChainId ?? 1) as ChainId);
  const oracle =
    savedOracle ??
    (token ? configuredTokenOracle(token.address, chainId) : undefined);
  return useOraclePrice(chainId, oracle, maxAge);
}
