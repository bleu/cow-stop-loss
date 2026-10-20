import { useAccount } from "wagmi";

import { configuredTokenOracle } from "#/lib/oraclePrice";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

import { useOraclePrice } from "./useOraclePrice";

export function useTokenPrice(
  token?: IToken,
  tokenChainId?: ChainId,
  maxAge?: number,
) {
  const { chainId: accountChainId } = useAccount();
  const chainId = tokenChainId ?? ((accountChainId ?? 1) as ChainId);
  const oracle = token
    ? configuredTokenOracle(token.address, chainId)
    : undefined;
  return useOraclePrice(chainId, oracle, maxAge);
}
