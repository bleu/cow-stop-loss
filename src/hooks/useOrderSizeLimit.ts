import useSWR from "swr";
import { parseUnits } from "viem";

import {
  assertOrderSizeLimit,
  ORDER_SIZE_LIMIT_EXCEEDED_ERROR,
} from "#/lib/orderSizeLimit";
import type { ChainId } from "#/lib/publicClients";
import type { IToken } from "#/lib/types";

export type OrderSizeLimitStatus =
  "checking" | "allowed" | "over" | "unavailable";

export function useOrderSizeLimit({
  chainId,
  tokenSell,
  sellAmount,
}: {
  chainId: ChainId;
  tokenSell?: IToken;
  sellAmount?: string;
}): OrderSizeLimitStatus {
  let atomicAmount: bigint | undefined;
  if (
    tokenSell &&
    sellAmount &&
    /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(sellAmount) &&
    (sellAmount.split(".")[1]?.length ?? 0) <= tokenSell.decimals
  ) {
    try {
      const parsed = parseUnits(sellAmount, tokenSell.decimals);
      if (parsed > BigInt(0)) atomicAmount = parsed;
    } catch {
      atomicAmount = undefined;
    }
  }

  const { data, error, isValidating } = useSWR(
    tokenSell && atomicAmount !== undefined
      ? [
          "orderSizeLimit",
          chainId,
          tokenSell.address.toLowerCase(),
          tokenSell.decimals,
          sellAmount,
        ]
      : null,
    async () => {
      await assertOrderSizeLimit({
        chainId,
        tokenSell: tokenSell!,
        sellAmount: atomicAmount!,
      });
      return "allowed" as const;
    },
    {
      keepPreviousData: false,
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 30_000,
      shouldRetryOnError: false,
    },
  );

  if (atomicAmount === undefined) return "unavailable";
  if (isValidating) return "checking";
  if (error)
    return error instanceof Error &&
      error.message === ORDER_SIZE_LIMIT_EXCEEDED_ERROR
      ? "over"
      : "unavailable";
  return data ?? "checking";
}
