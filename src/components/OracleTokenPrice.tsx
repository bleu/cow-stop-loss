"use client";

import { formatNumber } from "@bleu/ui";
import { Address } from "viem";

import { useOraclePrice } from "#/hooks/useOraclePrice";
import { ChainId } from "#/lib/publicClients";

export function OracleTokenPrice({
  chainId,
  oracle,
  tokenSymbol,
}: {
  chainId: ChainId;
  oracle: Address;
  tokenSymbol: string;
}) {
  const { data } = useOraclePrice(chainId, oracle);
  if (!data) return null;

  return (
    <p className="mt-1 text-[13px] font-normal text-muted-foreground">
      Current price: {formatNumber(data, 2, "currency", "standard")} per{" "}
      {tokenSymbol}
    </p>
  );
}
